package com.inventory.saas.service;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final InventoryRepository inventoryRepository;
    private final TransactionRepository transactionRepository;

    public byte[] generateWeeklyReport(String tenantId, String orgName) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.GRAY);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            Paragraph title = new Paragraph("Inventory Report: " + orgName, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph date = new Paragraph("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), subTitleFont);
            date.setAlignment(Element.ALIGN_CENTER);
            date.setSpacingAfter(20);
            document.add(date);

            List<InventoryItem> items = inventoryRepository.findAllByTenantId(tenantId);

            BigDecimal totalValuation = items.stream()
                    .map(i -> {
                        BigDecimal price = (i.getPrice() != null) ? i.getPrice() : BigDecimal.ZERO;
                        BigDecimal qty = (i.getQuantity() != null) ? BigDecimal.valueOf(i.getQuantity()) : BigDecimal.ZERO;
                        return price.multiply(qty);
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            document.add(new Paragraph("Summary Statistics", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Total Valuation: $" + totalValuation.setScale(2, RoundingMode.HALF_UP), bodyFont));
            document.add(new Paragraph("Total Unique SKUs: " + items.size(), bodyFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Recent Activity (Top 10)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            List<StockTransaction> recent = transactionRepository.findTop10ByTenantIdOrderByCreatedAtDesc(tenantId);

            PdfPTable transTable = new PdfPTable(4);
            transTable.setWidthPercentage(100);
            transTable.setSpacingBefore(10);
            String[] tHeaders = {"Date", "Item", "Action", "Qty"};

            for (String h : tHeaders) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, headFont));
                cell.setBackgroundColor(new Color(51, 65, 85));
                cell.setPadding(5);
                transTable.addCell(cell);
            }

            for (StockTransaction t : recent) {
                transTable.addCell(new PdfPCell(new Paragraph(t.getCreatedAt().toString().substring(0,10), bodyFont)));
                String itemName = (t.getInventoryItem() != null) ? t.getInventoryItem().getName() : "Deleted Item";
                transTable.addCell(new PdfPCell(new Paragraph(itemName, bodyFont)));
                transTable.addCell(new PdfPCell(new Paragraph(t.getType(), bodyFont)));
                transTable.addCell(new PdfPCell(new Paragraph(String.valueOf(t.getQuantityChange()), bodyFont)));
            }
            document.add(transTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Low Stock Alerts", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);

            String[] headers = {"Item Name", "SKU", "Qty", "Threshold"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, headFont));
                cell.setBackgroundColor(new Color(30, 41, 59));
                cell.setPadding(8);
                table.addCell(cell);
            }

            items.stream()
                    .filter(i -> i.getQuantity() <= (i.getMinThreshold() != null ? i.getMinThreshold() : 5))
                    .forEach(i -> {
                        table.addCell(new PdfPCell(new Paragraph(i.getName(), bodyFont)));
                        table.addCell(new PdfPCell(new Paragraph(i.getSku(), bodyFont)));
                        table.addCell(new PdfPCell(new Paragraph(String.valueOf(i.getQuantity()), bodyFont)));
                        table.addCell(new PdfPCell(new Paragraph(String.valueOf(i.getMinThreshold()), bodyFont)));
                    });

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}