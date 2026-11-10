package com.mypiggy.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.mypiggy.exception.ValidationException;
import com.mypiggy.model.Transaction;
import com.mypiggy.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Exportação das transações de um período em CSV (planilha) e PDF (relatório).
 * Transferências aparecem nos dois arquivos, mas não entram nos totais de receitas e despesas.
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private static final int MAX_RANGE_YEARS = 5;
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // Sem o BOM o Excel abre o arquivo como ANSI e "Alimentação" vira "AlimentaÃ§Ã£o"
    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    // Cores e fontes do PDF (Helvetica embutida: cobre acentos do português)
    private static final Color GREEN = new Color(0x16, 0xA3, 0x4A);
    private static final Color RED = new Color(0xDC, 0x26, 0x26);
    private static final Color GRAY = new Color(0x6B, 0x72, 0x80);
    private static final Color DARK = new Color(0x1F, 0x29, 0x37);
    private static final Color HEADER_BG = new Color(0xDC, 0xFC, 0xE7);
    private static final Color ZEBRA_BG = new Color(0xF9, 0xFA, 0xFB);
    private static final Color BORDER = new Color(0xE5, 0xE7, 0xEB);

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 20, Font.BOLD, GREEN);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 13, Font.BOLD, DARK);
    private static final Font HEADING_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, DARK);
    private static final Font TEXT_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, DARK);
    private static final Font TEXT_BOLD_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, DARK);
    private static final Font SMALL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, GRAY);

    private final TransactionRepository transactionRepository;

    /* ------------------------------------------------------------------ */
    /* CSV                                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * Uma linha por transação, em ordem cronológica. Formato pensado para o Excel brasileiro:
     * separador ";", UTF-8 com BOM, data dd/MM/yyyy e vírgula decimal.
     * Valor: receita positiva, despesa negativa; transferência sem sinal (veja a coluna Tipo).
     */
    @Transactional(readOnly = true)
    public byte[] generateCsv(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = loadTransactions(userId, startDate, endDate);

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setRecordSeparator("\r\n")
                .build();

        DecimalFormat money = new DecimalFormat("0.00", new DecimalFormatSymbols(PT_BR));

        StringWriter out = new StringWriter();
        try (CSVPrinter printer = new CSVPrinter(out, format)) {
            printer.printRecord("Data", "Tipo", "Descrição", "Categoria", "Conta",
                    "Conta de destino", "Valor (R$)", "Recorrência");

            for (Transaction t : transactions) {
                String amount = money.format(BigDecimal.valueOf(t.getAmountInCents(), 2));
                if ("DEBIT".equals(t.getTransactionType())) {
                    amount = "-" + amount;
                }

                printer.printRecord(
                        t.getTransactionDate().format(DATE_FMT),
                        typeLabel(t.getTransactionType()),
                        safeText(t.getDescription()),
                        safeText(categoryName(t)),
                        safeText(t.getAccount().getName()),
                        safeText(t.getDestinationAccount() != null
                                ? t.getDestinationAccount().getName() : ""),
                        amount,
                        recurrenceLabel(t));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao gerar o CSV", e);
        }

        byte[] body = out.toString().getBytes(StandardCharsets.UTF_8);
        byte[] file = new byte[UTF8_BOM.length + body.length];
        System.arraycopy(UTF8_BOM, 0, file, 0, UTF8_BOM.length);
        System.arraycopy(body, 0, file, UTF8_BOM.length, body.length);
        return file;
    }

    /* ------------------------------------------------------------------ */
    /* PDF                                                                 */
    /* ------------------------------------------------------------------ */

    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = loadTransactions(userId, startDate, endDate);

        long income = sumByType(transactions, "CREDIT");
        long expense = sumByType(transactions, "DEBIT");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 40, 50);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PageNumberFooter());
            document.open();

            // Cabeçalho
            document.add(new Paragraph("MyPiggy", TITLE_FONT));
            document.add(new Paragraph("Relatório de transações", SUBTITLE_FONT));

            Paragraph period = new Paragraph(
                    "Período: " + startDate.format(DATE_FMT) + " a " + endDate.format(DATE_FMT)
                            + "   |   Gerado em " + LocalDateTime.now().format(DATETIME_FMT), SMALL_FONT);
            period.setSpacingBefore(4);
            document.add(period);

            // Resumo
            PdfPTable summary = new PdfPTable(3);
            summary.setWidthPercentage(100);
            summary.setSpacingBefore(12);
            summary.addCell(summaryCell("Receitas", brl(income), GREEN));
            summary.addCell(summaryCell("Despesas", brl(expense), RED));
            summary.addCell(summaryCell("Resultado do período", brl(income - expense),
                    income - expense < 0 ? RED : GREEN));
            document.add(summary);

            Paragraph note = new Paragraph(
                    "Transferências entre contas aparecem na lista, mas não entram nos totais.", SMALL_FONT);
            note.setSpacingBefore(4);
            document.add(note);

            if (transactions.isEmpty()) {
                Paragraph empty = new Paragraph("Nenhuma transação encontrada no período.", TEXT_FONT);
                empty.setSpacingBefore(20);
                document.add(empty);
            } else {
                addCategorySection(document, "Despesas por categoria", transactions, "DEBIT", expense);
                addCategorySection(document, "Receitas por categoria", transactions, "CREDIT", income);
                addTransactionsSection(document, transactions);
            }

            // Precisa fechar ANTES de ler os bytes. Não há "finally" de propósito: se algo falhar
            // no meio, fechar um documento incompleto lançaria OUTRO erro e esconderia a causa real
            document.close();
        } catch (DocumentException e) {
            throw new IllegalStateException("Erro ao gerar o PDF", e);
        }

        return out.toByteArray();
    }

    private void addCategorySection(Document document, String title, List<Transaction> transactions,
                                    String type, long total) throws DocumentException {
        // Soma por categoria; transações sem categoria entram como "Sem categoria"
        Map<String, long[]> byCategory = new LinkedHashMap<>();
        for (Transaction t : transactions) {
            if (!type.equals(t.getTransactionType())) continue;
            long[] v = byCategory.computeIfAbsent(categoryName(t), k -> new long[1]);
            v[0] += t.getAmountInCents();
        }
        if (byCategory.isEmpty()) return;

        List<Map.Entry<String, long[]>> rows = new ArrayList<>(byCategory.entrySet());
        rows.sort(Comparator.<Map.Entry<String, long[]>>comparingLong(e -> e.getValue()[0]).reversed()
                .thenComparing(Map.Entry::getKey));

        Paragraph heading = new Paragraph(title, HEADING_FONT);
        heading.setSpacingBefore(16);
        heading.setSpacingAfter(6);
        heading.setKeepTogether(true);
        document.add(heading);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{60f, 25f, 15f});
        table.setHeaderRows(1);
        table.addCell(headerCell("Categoria", Element.ALIGN_LEFT));
        table.addCell(headerCell("Valor", Element.ALIGN_RIGHT));
        table.addCell(headerCell("%", Element.ALIGN_RIGHT));

        int i = 0;
        for (Map.Entry<String, long[]> row : rows) {
            Color bg = i++ % 2 == 1 ? ZEBRA_BG : null;
            long value = row.getValue()[0];
            double pct = total > 0 ? Math.round(value * 1000.0 / total) / 10.0 : 0.0;
            table.addCell(bodyCell(row.getKey(), TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(brl(value), TEXT_FONT, Element.ALIGN_RIGHT, bg));
            table.addCell(bodyCell(String.format(PT_BR, "%.1f%%", pct), TEXT_FONT, Element.ALIGN_RIGHT, bg));
        }
        document.add(table);
    }

    private void addTransactionsSection(Document document, List<Transaction> transactions)
            throws DocumentException {
        Paragraph heading = new Paragraph("Transações (" + transactions.size() + ")", HEADING_FONT);
        heading.setSpacingBefore(16);
        heading.setSpacingAfter(6);
        heading.setKeepTogether(true);
        document.add(heading);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{12f, 13f, 27f, 18f, 16f, 14f});
        table.setHeaderRows(1); // o cabeçalho se repete em cada página

        table.addCell(headerCell("Data", Element.ALIGN_LEFT));
        table.addCell(headerCell("Tipo", Element.ALIGN_LEFT));
        table.addCell(headerCell("Descrição", Element.ALIGN_LEFT));
        table.addCell(headerCell("Categoria", Element.ALIGN_LEFT));
        table.addCell(headerCell("Conta", Element.ALIGN_LEFT));
        table.addCell(headerCell("Valor", Element.ALIGN_RIGHT));

        int i = 0;
        for (Transaction t : transactions) {
            Color bg = i++ % 2 == 1 ? ZEBRA_BG : null;
            boolean transfer = "TRANSFER".equals(t.getTransactionType());
            boolean debit = "DEBIT".equals(t.getTransactionType());

            String account = t.getAccount().getName();
            if (transfer && t.getDestinationAccount() != null) {
                // "→" não existe na fonte Helvetica padrão, por isso ">"
                account += " > " + t.getDestinationAccount().getName();
            }

            String description = t.getDescription() == null || t.getDescription().isBlank()
                    ? "-" : t.getDescription().trim();

            Font valueFont = new Font(Font.HELVETICA, 9, Font.BOLD,
                    transfer ? GRAY : debit ? RED : GREEN);
            String value = (debit ? "-" : "") + brl(t.getAmountInCents());

            table.addCell(bodyCell(t.getTransactionDate().format(DATE_FMT), TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(typeLabel(t.getTransactionType()), TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(description, TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(categoryName(t), TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(account, TEXT_FONT, Element.ALIGN_LEFT, bg));
            table.addCell(bodyCell(value, valueFont, Element.ALIGN_RIGHT, bg));
        }
        document.add(table);
    }

    private static PdfPCell summaryCell(String label, String value, Color color) {
        PdfPCell cell = new PdfPCell();
        cell.addElement(new Paragraph(label, SMALL_FONT));
        cell.addElement(new Paragraph(value, new Font(Font.HELVETICA, 14, Font.BOLD, color)));
        cell.setPadding(8);
        cell.setBorderColor(BORDER);
        return cell;
    }

    private static PdfPCell headerCell(String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TEXT_BOLD_FONT));
        cell.setHorizontalAlignment(align);
        cell.setBackgroundColor(HEADER_BG);
        cell.setPadding(5);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(BORDER);
        return cell;
    }

    private static PdfPCell bodyCell(String text, Font font, int align, Color background) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(BORDER);
        if (background != null) cell.setBackgroundColor(background);
        return cell;
    }

    // Rodapé com o número da página
    private static class PageNumberFooter extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle page = document.getPageSize();
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_CENTER,
                    new Phrase("MyPiggy - Página " + writer.getPageNumber(), SMALL_FONT),
                    (page.getLeft() + page.getRight()) / 2, document.bottom() - 20, 0);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Utilitários                                                         */
    /* ------------------------------------------------------------------ */

    private List<Transaction> loadTransactions(UUID userId, LocalDate startDate, LocalDate endDate) {
        validatePeriod(startDate, endDate);

        // Intervalo semiaberto [início do 1º dia, início do dia seguinte ao último):
        // uma transação à meia-noite do dia seguinte não pode entrar no relatório
        return transactionRepository.findForExport(
                userId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
    }

    private static void validatePeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new ValidationException("Informe startDate e endDate (formato YYYY-MM-DD)");
        }
        if (startDate.isAfter(endDate)) {
            throw new ValidationException("A data inicial não pode ser posterior à data final");
        }
        if (endDate.isAfter(startDate.plusYears(MAX_RANGE_YEARS))) {
            throw new ValidationException(
                    "O período máximo de exportação é de " + MAX_RANGE_YEARS + " anos");
        }
    }

    private static long sumByType(List<Transaction> transactions, String type) {
        long total = 0;
        for (Transaction t : transactions) {
            if (type.equals(t.getTransactionType())) total += t.getAmountInCents();
        }
        return total;
    }

    private static String categoryName(Transaction t) {
        return t.getCategory() != null ? t.getCategory().getName() : "Sem categoria";
    }

    private static String typeLabel(String type) {
        return switch (type) {
            case "CREDIT" -> "Receita";
            case "DEBIT" -> "Despesa";
            case "TRANSFER" -> "Transferência";
            default -> type;
        };
    }

    private static String recurrenceLabel(Transaction t) {
        if (!Boolean.TRUE.equals(t.getIsRecurring())) return "";
        String r = t.getRecurrencyType();
        if (r == null) return "Recorrente";
        return switch (r) {
            case "DAILY" -> "Diária";
            case "WEEKLY" -> "Semanal";
            case "MONTHLY" -> "Mensal";
            case "ANNUAL" -> "Anual";
            default -> r;
        };
    }

    // "R$ 1.234,56" (o sinal, quando existe, é colocado por quem chama)
    private static String brl(long cents) {
        DecimalFormat df = new DecimalFormat("#,##0.00", new DecimalFormatSymbols(PT_BR));
        String value = df.format(BigDecimal.valueOf(Math.abs(cents), 2));
        return (cents < 0 ? "-R$ " : "R$ ") + value;
    }

    // Proteção contra "injeção de fórmula": textos livres que começam com = + - @ seriam
    // executados como fórmula pelo Excel. O apóstrofo força o Excel a tratar como texto.
    private static String safeText(String value) {
        if (value == null || value.isEmpty()) return "";
        char first = value.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@'
                || first == '\t' || first == '\r') {
            return "'" + value;
        }
        return value;
    }
}