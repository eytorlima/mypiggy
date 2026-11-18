package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.ReportResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.ExportFilter;
import com.mypiggy.service.ExportService;
import com.mypiggy.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ExportService exportService;

    // Gastos (ou receitas) agrupados por categoria: alimenta o gráfico de pizza/colunas
    // GET /api/reports/by-category?month=2026-11&type=DEBIT
    @GetMapping("/by-category")
    public ResponseEntity<ApiResponse<ReportResponseDTO.CategoryReport>> byCategory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String type) {

        ReportResponseDTO.CategoryReport report =
                reportService.getByCategory(user.getId(), month, type);
        return ResponseEntity.ok(ApiResponse.success("Relatório por categoria gerado", report));
    }

    // Receitas e despesas dos últimos N meses: alimenta o gráfico de barras
    // GET /api/reports/monthly?months=6
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<ReportResponseDTO.MonthlyReport>> monthly(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "6") int months) {

        ReportResponseDTO.MonthlyReport report = reportService.getMonthly(user.getId(), months);
        return ResponseEntity.ok(ApiResponse.success("Relatório mensal gerado", report));
    }

    // Evolução do saldo (consolidado, ou de uma conta com ?accountId=)
    // GET /api/reports/balance-history?months=6&accountId=
    @GetMapping("/balance-history")
    public ResponseEntity<ApiResponse<ReportResponseDTO.BalanceHistory>> balanceHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(defaultValue = "6") int months) {

        ReportResponseDTO.BalanceHistory history =
                reportService.getBalanceHistory(user.getId(), accountId, months);
        return ResponseEntity.ok(ApiResponse.success("Histórico de saldo gerado", history));
    }

    // Extrato do período em planilha, com filtros opcionais
    // GET /api/reports/export/csv?startDate=2026-11-01&endDate=2026-11-30
    //     &types=CREDIT,DEBIT&categoryIds=1,2&accountIds=uuid1,uuid2
    //
    // Sem types/categoryIds/accountIds = extrato completo. Listas vão separadas por vírgula.
    // Os parâmetros de data são opcionais aqui de propósito: se faltarem, o service responde 400
    // com mensagem clara (um parâmetro obrigatório ausente cairia no handler genérico, como 500).
    // Também não há "produces": se houvesse, a resposta de ERRO (JSON) seria recusada.
    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> types,
            @RequestParam(required = false) List<Integer> categoryIds,
            @RequestParam(required = false) List<UUID> accountIds) {

        ExportFilter filter = ExportFilter.of(types, categoryIds, accountIds);
        byte[] file = exportService.generateCsv(user.getId(), startDate, endDate, filter);
        return download(file, MediaType.parseMediaType("text/csv;charset=UTF-8"),
                fileName(startDate, endDate, "csv"));
    }

    // Relatório do período em PDF (mesmos parâmetros do CSV)
    // GET /api/reports/export/pdf?startDate=2026-11-01&endDate=2026-11-30
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> types,
            @RequestParam(required = false) List<Integer> categoryIds,
            @RequestParam(required = false) List<UUID> accountIds) {

        ExportFilter filter = ExportFilter.of(types, categoryIds, accountIds);
        byte[] file = exportService.generatePdf(user.getId(), startDate, endDate, filter);
        return download(file, MediaType.APPLICATION_PDF, fileName(startDate, endDate, "pdf"));
    }

    private static String fileName(LocalDate startDate, LocalDate endDate, String extension) {
        return "mypiggy-extrato-" + startDate + "_" + endDate + "." + extension;
    }

    // "attachment" faz o navegador baixar o arquivo em vez de tentar exibi-lo
    private static ResponseEntity<byte[]> download(byte[] file, MediaType type, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8)
                                .build().toString())
                .contentType(type)
                .contentLength(file.length)
                .body(file);
    }
}