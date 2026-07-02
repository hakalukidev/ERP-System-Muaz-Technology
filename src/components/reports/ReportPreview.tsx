import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Button, Card, Col, List, Row, Space, Statistic } from "antd";
import { ReportData } from "@/types/report";

interface ReportPreviewProps {
  type: string;
  data: ReportData;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export function ReportPreview({ type, data, onExportPDF, onExportExcel }: ReportPreviewProps) {
  return (
    <Card
      title={data.title}
      extra={
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={onExportPDF}>
            PDF
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onExportExcel}>
            Excel
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={8}>
          <Statistic title="Total Amount" prefix="$" value={data.summary.total} precision={2} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Total Items" value={data.summary.count} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Average" prefix="$" value={data.summary.average} precision={2} />
        </Col>
      </Row>

      <List
        bordered
        dataSource={data.items}
        renderItem={(item) => (
          <List.Item>
            <span>{item.label}</span>
            <strong>${item.value.toFixed(2)}</strong>
          </List.Item>
        )}
      />
    </Card>
  );
}
