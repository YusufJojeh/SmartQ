<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Services\ReportsService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __construct(
        private readonly ReportsService $reportsService,
    ) {}

    public function __invoke(Request $request): InertiaResponse
    {
        abort_unless($request->user()?->hasPermissionTo('report.view'), 403);

        return Inertia::render('reports/index', $this->reportsService->build($request->user()));
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->hasPermissionTo('report.export'), 403);

        $rows     = $this->reportsService->exportRows($request->user());
        $from     = $rows['dateRange']['from'];
        $to       = $rows['dateRange']['to'];
        $filename = "smartq-report-{$from}-to-{$to}.xlsx";

        AuditLog::record('report.exported', null, [], [
            'from'       => $from,
            'to'         => $to,
            'branch_id'  => $rows['branch_id'],
            'row_count'  => count($rows['tickets']),
            'format'     => 'xlsx',
        ]);

        $spreadsheet = $this->buildSpreadsheet($rows, $from, $to);

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control'       => 'max-age=0',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    // ─── Spreadsheet builder ──────────────────────────────────────────────────

    private function buildSpreadsheet(array $rows, string $from, string $to): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('SmartQ')
            ->setTitle("SmartQ Report {$from} to {$to}")
            ->setSubject('Queue Operations Report')
            ->setDescription('Exported from SmartQ queue management platform');

        // Sheet 1 — Summary
        $this->buildSummarySheet($spreadsheet, $rows, $from, $to);

        // Sheet 2 — Ticket detail
        $this->buildTicketsSheet($spreadsheet, $rows['tickets']);

        // Sheet 3 — Teller performance (if data available)
        if (!empty($rows['tellerStats'])) {
            $this->buildTellerSheet($spreadsheet, $rows['tellerStats']);
        }

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    // ─── Sheet 1: Summary ─────────────────────────────────────────────────────

    private function buildSummarySheet(Spreadsheet $spreadsheet, array $rows, string $from, string $to): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Summary');

        // Colour palette
        $navy  = '0A1628'; // deep navy (ink)
        $amber = 'F0800D'; // warm amber accent
        $white = 'FFFFFF';
        $light = 'FBF9F5'; // paper-soft
        $muted = '8B9BB4'; // muted-foreground

        // ── Title banner ─────────────────────────────────────────────────────
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'SmartQ — Queue Operations Report');
        $this->applyStyle($sheet, 'A1:G1', [
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $white]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(36);

        // ── Date range ───────────────────────────────────────────────────────
        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', "Period: {$from} to {$to}");
        $this->applyStyle($sheet, 'A2:G2', [
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => $white]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '1C2F4A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(20);

        // ── KPI section ──────────────────────────────────────────────────────
        $metrics = $rows['metrics'] ?? [];
        $kpis = [
            ['Total Tickets Issued',    $metrics['total_tickets']      ?? 0, ''],
            ['Completed Tickets',       $metrics['completed_tickets']  ?? 0, ''],
            ['Completion Rate',         ($metrics['completion_rate']   ?? 0) . '%', ''],
            ['Avg Wait Time',           ($metrics['avg_wait_minutes']  ?? 0) . ' min', ''],
            ['Avg Service Time',        ($metrics['avg_service_minutes'] ?? 0) . ' min', ''],
        ];

        $sheet->getRowDimension(3)->setRowHeight(10); // spacer

        $this->applyStyle($sheet, 'A4:C4', [
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $white]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $amber]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->mergeCells('A4:C4');
        $sheet->setCellValue('A4', '  Key Performance Indicators');
        $sheet->getRowDimension(4)->setRowHeight(24);

        $kpiRow = 5;
        $altBg  = false;
        foreach ($kpis as [$label, $value]) {
            $bg = $altBg ? 'F0EFE9' : $light;
            $this->applyStyle($sheet, "A{$kpiRow}:B{$kpiRow}", [
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bg]],
            ]);
            $sheet->setCellValue("A{$kpiRow}", $label);
            $sheet->setCellValue("B{$kpiRow}", $value);
            $this->applyStyle($sheet, "B{$kpiRow}", [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $navy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
            $sheet->getRowDimension($kpiRow)->setRowHeight(22);
            $kpiRow++;
            $altBg = !$altBg;
        }

        // ── Daily volume table ───────────────────────────────────────────────
        $dailyRow = $kpiRow + 2;
        $sheet->mergeCells("A{$dailyRow}:D{$dailyRow}");
        $sheet->setCellValue("A{$dailyRow}", '  Daily Volume (Last 7 Days)');
        $this->applyStyle($sheet, "A{$dailyRow}:D{$dailyRow}", [
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => $white]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $amber]],
        ]);
        $sheet->getRowDimension($dailyRow)->setRowHeight(24);

        $headRow = $dailyRow + 1;
        foreach (['Date', 'Total', 'Completed', 'Completion %'] as $col => $header) {
            $cell = chr(65 + $col) . $headRow;
            $sheet->setCellValue($cell, $header);
            $this->applyStyle($sheet, $cell, [
                'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => $white]],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }
        $sheet->getRowDimension($headRow)->setRowHeight(18);

        $dataRow = $headRow + 1;
        $altBg = false;
        foreach ($rows['dailyVolume'] ?? [] as $day) {
            $bg  = $altBg ? 'F0EFE9' : $light;
            $pct = $day['total'] > 0 ? round($day['completed'] / $day['total'] * 100, 1) : 0;
            $sheet->setCellValue("A{$dataRow}", $day['date']);
            $sheet->setCellValue("B{$dataRow}", $day['total']);
            $sheet->setCellValue("C{$dataRow}", $day['completed']);
            $sheet->setCellValue("D{$dataRow}", "{$pct}%");
            $this->applyStyle($sheet, "A{$dataRow}:D{$dataRow}", [
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->setCellValue("A{$dataRow}", $day['date']); // left-align date
            $this->applyStyle($sheet, "A{$dataRow}", ['alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]]);
            $sheet->getRowDimension($dataRow)->setRowHeight(18);
            $dataRow++;
            $altBg = !$altBg;
        }

        // ── Footer ────────────────────────────────────────────────────────────
        $footerRow = $dataRow + 2;
        $sheet->mergeCells("A{$footerRow}:G{$footerRow}");
        $sheet->setCellValue("A{$footerRow}", 'Generated by SmartQ · ' . now()->format('Y-m-d H:i'));
        $this->applyStyle($sheet, "A{$footerRow}:G{$footerRow}", [
            'font' => ['italic' => true, 'size' => 8, 'color' => ['rgb' => $muted]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(16);
        $sheet->getColumnDimension('C')->setWidth(16);
        $sheet->getColumnDimension('D')->setWidth(16);
        $sheet->getColumnDimension('E')->setWidth(16);
        $sheet->getColumnDimension('F')->setWidth(16);
        $sheet->getColumnDimension('G')->setWidth(16);

        // Freeze top rows
        $sheet->freezePane('A3');
    }

    // ─── Sheet 2: Ticket detail ───────────────────────────────────────────────

    private function buildTicketsSheet(Spreadsheet $spreadsheet, array $tickets): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Ticket Detail');

        $navy  = '0A1628';
        $amber = 'F0800D';
        $white = 'FFFFFF';
        $light = 'FBF9F5';

        // Header row
        $headers = [
            'A' => 'Ticket Code',
            'B' => 'Branch',
            'C' => 'Service',
            'D' => 'Teller',
            'E' => 'Status',
            'F' => 'Joined At',
            'G' => 'Called At',
            'H' => 'Completed At',
            'I' => 'Wait (min)',
            'J' => 'Service (min)',
        ];

        foreach ($headers as $col => $header) {
            $sheet->setCellValue("{$col}1", $header);
        }
        $this->applyStyle($sheet, 'A1:J1', [
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $white]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $amber]]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(22);

        // Data rows
        $row   = 2;
        $altBg = false;

        foreach ($tickets as $ticket) {
            $bg = $altBg ? 'F0EFE9' : $light;

            $sheet->setCellValue("A{$row}", $ticket['display_code']);
            $sheet->setCellValue("B{$row}", $ticket['branch']);
            $sheet->setCellValue("C{$row}", $ticket['service']);
            $sheet->setCellValue("D{$row}", $ticket['teller'] ?: '—');
            $sheet->setCellValue("E{$row}", ucfirst(str_replace('_', ' ', $ticket['status'])));
            $sheet->setCellValue("F{$row}", $ticket['joined_at'] ? date('Y-m-d H:i', strtotime($ticket['joined_at'])) : '');
            $sheet->setCellValue("G{$row}", $ticket['called_at'] ? date('Y-m-d H:i', strtotime($ticket['called_at'])) : '');
            $sheet->setCellValue("H{$row}", $ticket['completed_at'] ? date('Y-m-d H:i', strtotime($ticket['completed_at'])) : '');
            $sheet->setCellValue("I{$row}", $ticket['actual_wait_minutes'] ?? '');
            $sheet->setCellValue("J{$row}", $ticket['actual_service_minutes'] ?? '');

            $this->applyStyle($sheet, "A{$row}:J{$row}", [
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bg]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);

            // Status colour coding
            $statusColor = match ($ticket['status']) {
                'completed'  => '1A7A50',
                'cancelled'  => 'C0392B',
                'missed'     => 'D35400',
                'in_service' => '1A5276',
                'on_hold'    => '6C3483',
                'called'     => 'B7950B',
                default      => '2C3E50',
            };
            $this->applyStyle($sheet, "E{$row}", [
                'font' => ['bold' => true, 'color' => ['rgb' => $statusColor]],
            ]);

            // Numeric alignment
            $this->applyStyle($sheet, "I{$row}:J{$row}", [
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $sheet->getRowDimension($row)->setRowHeight(18);
            $row++;
            $altBg = !$altBg;
        }

        // Auto-filter on header row
        $sheet->setAutoFilter("A1:J1");

        // Column widths
        foreach ([
            'A' => 14, 'B' => 24, 'C' => 26, 'D' => 22,
            'E' => 16, 'F' => 18, 'G' => 18, 'H' => 18,
            'I' => 12, 'J' => 14,
        ] as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Freeze header
        $sheet->freezePane('A2');

        // Total row
        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("I{$row}", "=AVERAGE(I2:I{$lastDataRow})");
            $sheet->setCellValue("J{$row}", "=AVERAGE(J2:J{$lastDataRow})");
            $this->applyStyle($sheet, "A{$row}:J{$row}", [
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $white]],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
                'borders' => ['top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $amber]]],
            ]);
            $sheet->getRowDimension($row)->setRowHeight(20);
        }
    }

    // ─── Sheet 3: Teller performance ─────────────────────────────────────────

    private function buildTellerSheet(Spreadsheet $spreadsheet, array $tellerStats): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Teller Performance');

        $navy  = '0A1628';
        $amber = 'F0800D';
        $white = 'FFFFFF';
        $light = 'FBF9F5';

        // Header
        $headers = [
            'A' => 'Rank',
            'B' => 'Teller Name',
            'C' => 'Tickets Completed',
            'D' => 'Avg Service Time (min)',
        ];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue("{$col}1", $header);
        }
        $this->applyStyle($sheet, 'A1:D1', [
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $white]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $amber]]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(22);

        $row   = 2;
        $altBg = false;
        foreach ($tellerStats as $i => $teller) {
            $bg = $altBg ? 'F0EFE9' : $light;

            // Gold/silver/bronze for top 3
            $rankColor = match ($i) {
                0 => 'B8860B', // gold
                1 => '708090', // silver
                2 => 'CD7F32', // bronze
                default => $navy,
            };

            $sheet->setCellValue("A{$row}", $i + 1);
            $sheet->setCellValue("B{$row}", $teller['name']);
            $sheet->setCellValue("C{$row}", $teller['completed']);
            $sheet->setCellValue("D{$row}", $teller['avg_service_time']);

            $this->applyStyle($sheet, "A{$row}:D{$row}", [
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $bg]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $this->applyStyle($sheet, "A{$row}", [
                'font'      => ['bold' => true, 'color' => ['rgb' => $rankColor]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $this->applyStyle($sheet, "C{$row}:D{$row}", [
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $sheet->getRowDimension($row)->setRowHeight(20);
            $row++;
            $altBg = !$altBg;
        }

        // Totals row
        if ($row > 2) {
            $last = $row - 1;
            $sheet->setCellValue("B{$row}", 'Average');
            $sheet->setCellValue("C{$row}", "=AVERAGE(C2:C{$last})");
            $sheet->setCellValue("D{$row}", "=AVERAGE(D2:D{$last})");
            $this->applyStyle($sheet, "A{$row}:D{$row}", [
                'font'    => ['bold' => true, 'color' => ['rgb' => $white]],
                'fill'    => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => $navy]],
                'borders' => ['top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $amber]]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getRowDimension($row)->setRowHeight(20);
        }

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(22);
        $sheet->getColumnDimension('D')->setWidth(26);

        $sheet->freezePane('A2');
        $sheet->setAutoFilter('A1:D1');
    }

    // ─── Style helper ─────────────────────────────────────────────────────────

    private function applyStyle(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, string $range, array $style): void
    {
        $styleArray = [];

        if (isset($style['font'])) {
            $f = $style['font'];
            $styleArray['font'] = array_filter([
                'bold'   => $f['bold']   ?? null,
                'italic' => $f['italic'] ?? null,
                'size'   => $f['size']   ?? null,
                'color'  => isset($f['color']['rgb']) ? ['argb' => 'FF' . $f['color']['rgb']] : null,
            ]);
        }

        if (isset($style['fill'])) {
            $fi = $style['fill'];
            $styleArray['fill'] = [
                'fillType' => $fi['fillType'],
                'startColor' => ['argb' => 'FF' . ($fi['color']['rgb'] ?? 'FFFFFF')],
            ];
        }

        if (isset($style['alignment'])) {
            $styleArray['alignment'] = $style['alignment'];
        }

        if (isset($style['borders'])) {
            foreach ($style['borders'] as $side => $border) {
                $styleArray['borders'][$side] = [
                    'borderStyle' => $border['borderStyle'],
                    'color'       => ['argb' => 'FF' . ($border['color']['rgb'] ?? '000000')],
                ];
            }
        }

        $sheet->getStyle($range)->applyFromArray($styleArray);
    }
}
