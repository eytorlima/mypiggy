package com.mypiggy.controller;

import com.mypiggy.dto.ApiResponse;
import com.mypiggy.dto.ReportResponseDTO;
import com.mypiggy.model.User;
import com.mypiggy.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

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
}