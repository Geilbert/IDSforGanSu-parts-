import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Space, Table, Tag, Typography } from 'antd';

const { Title } = Typography;

const DeliveryTaskLogDetail: React.FC = () => {
  const { orderId, taskId } = useParams();
  const navigate = useNavigate();

  const rows = [
    { key: '1', time: '2026-04-13 10:11:20', level: 'INFO', action: '任务初始化', detail: '已加载策略模板与执行参数' },
    { key: '2', time: '2026-04-13 10:13:42', level: 'INFO', action: '资源检查', detail: '源连接器与目标连接器联通正常' },
    { key: '3', time: '2026-04-13 10:18:17', level: 'WARN', action: '重试机制', detail: '上游返回超时，自动重试第 1 次' },
    { key: '4', time: '2026-04-13 10:20:33', level: 'INFO', action: '阶段完成', detail: '当前任务节点处理完成' },
  ];

  return (
    <div className="space-y-4">
      <Space className="w-full justify-between">
        <Title level={4} style={{ margin: 0 }}>
          任务日志详情：{taskId}
        </Title>
        <Button onClick={() => navigate(`/delivery/orders/${encodeURIComponent(orderId || '')}`)}>返回订单详情</Button>
      </Space>

      <Card size="small">
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="订单编号">{orderId}</Descriptions.Item>
          <Descriptions.Item label="任务ID">{taskId}</Descriptions.Item>
          <Descriptions.Item label="任务类型">数据处理节点</Descriptions.Item>
          <Descriptions.Item label="当前状态"><Tag color="processing">执行中</Tag></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="任务执行日志">
        <Table
          rowKey="key"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: '时间', dataIndex: 'time' },
            {
              title: '级别',
              dataIndex: 'level',
              render: (lvl: string) => <Tag color={lvl === 'WARN' ? 'orange' : 'blue'}>{lvl}</Tag>,
            },
            { title: '动作', dataIndex: 'action' },
            { title: '详情', dataIndex: 'detail' },
          ]}
        />
      </Card>
    </div>
  );
};

export default DeliveryTaskLogDetail;

