import React from 'react';
import { Badge, Card, Col, Row, Steps, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const logs = [
  'Read: 读取资源 User_Transaction_Records 成功',
  'Entry: 策略参数加载完成（mTLS + watermark）',
  'Move: 动态脱敏规则 R-102 执行通过',
  'Move: 加密传输通道建立成功',
  'Exit: 链上存证交易提交（Fabric Tx: 0x9a2f...）',
];

const DeliveryAuditTraceability: React.FC = () => {
  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>
        交付审计与详情
      </Title>
      <Card size="small">
        <Steps
          current={4}
          items={[
            { title: '资源提取' },
            { title: '策略校验' },
            { title: '动态脱敏' },
            { title: '加密传输' },
            { title: '链上存证' },
          ]}
        />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="合约条文（只读预览）" size="small">
            <Paragraph>
              1. 数据资产仅用于授权范围内模型训练；
              <br />
              2. 下载次数不得超过约定阈值；
              <br />
              3. 传输必须启用 mTLS，并附加隐形水印；
              <br />
              4. 任何导出行为均需链上留痕。
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="实时日志流" size="small">
            <div className="space-y-2">
              {logs.map((line) => (
                <Paragraph key={line} style={{ marginBottom: 6 }}>
                  <Text code>{line}</Text>
                </Paragraph>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Badge status="success" text={<Text strong style={{ color: '#389e0d' }}>数据完整性校验通过</Text>} />
      </Card>
    </div>
  );
};

export default DeliveryAuditTraceability;

