package com.inventory.saas.controller;

import com.inventory.saas.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/weekly")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER')")
    public ResponseEntity<byte[]> downloadWeeklyReport(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Tenant-Plan", defaultValue = "free") String plan,
            @RequestParam(defaultValue = "Workspace") String orgName) {

        byte[] pdfContent = reportService.generateWeeklyReport(tenantId, orgName, plan);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"inventory_report.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfContent.length)
                .body(pdfContent);
    }
}