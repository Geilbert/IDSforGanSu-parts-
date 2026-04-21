import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Descriptions, Drawer, Empty, Row, Select, Skeleton, Space, Table, Tabs, Tag, Timeline, Typography, message } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DeliveryOrderDetail: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [pipelineRows, setPipelineRows] = React.useState([
    { key: '1', taskId: 'T-102201', title: '可信计算执行', type: '可信计算', status: '执行中', startTime: '2026-04-13 10:20:00', progress: '61%', log: '处理中...' },
    { key: '2', taskId: 'T-102205', title: '质量稽核', type: '质量检查', status: '待执行', startTime: '-', progress: '0%', log: '等待上游完成' },
    { key: '3', taskId: 'T-102210', title: '结果回传', type: '文件传输', status: '待执行', startTime: '-', progress: '0%', log: '等待依赖任务' },
  ]);
  const [selectedTask, setSelectedTask] = React.useState<(typeof pipelineRows)[number] | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false);
  const [logType, setLogType] = React.useState<string | undefined>(undefined);
  const [logRange, setLogRange] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'pipeline') return;
    const timer = setInterval(() => {
      setPipelineRows((prev) =>
        prev.map((item) => {
          if (item.status !== '执行中') return item;
          const nextProgress = Math.min(100, Number(item.progress.replace('%', '')) + 8);
          return {
            ...item,
            progress: `${nextProgress}%`,
            status: nextProgress >= 100 ? '已完成' : '执行中',
            log: nextProgress >= 100 ? '任务完成' : `处理中... ${nextProgress}%`,
          };
        }),
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const logs = [
    { id: '1', time: '2026-04-13 10:10', operator: 'admin', action: '创建订单', detail: '创建交付订单成功', type: '系统' },
    { id: '2', time: '2026-04-13 10:12', operator: 'system', action: '触发流水线', detail: '已创建3个任务节点', type: '任务' },
    { id: '3', time: '2026-04-13 10:20', operator: 'system', action: '任务执行', detail: '可信计算节点开始执行', type: '任务' },
    { id: '4', time: '2026-04-13 10:36', operator: 'system', action: '质量告警', detail: '质量规则 QR-08 命中阈值告警', type: '告警' },
  ];

  const filteredLogs = logs.filter((item) => {
    if (logType && item.type !== logType) return false;
    if (logRange === 'today') return dayjs(item.time).isAfter(dayjs().startOf('day'));
    return true;
  });

  const currentStatus = pipelineRows.every((item) => item.status === '已完成') ? '已完成' : '执行中';

  return (
    <div className="space-y-4">
      <Space className="w-full justify-between">
        <Title level={4} style={{ margin: 0 }}>
          订单详情：{decodeURIComponent(orderId || '')}
        </Title>
        <Button onClick={() => navigate('/delivery/orders')}>返回</Button>
      </Space>

      <Card size="small">
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: '订单概览',
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="合约与基础信息" className="bg-gray-50">
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="源连接器">Oracle_CRM_Replica</Descriptions.Item>
                        <Descriptions.Item label="目标连接器">Local_File_Server</Descriptions.Item>
                        <Descriptions.Item label="数据产品">Customer_Profile_Master（结构化数据）</Descriptions.Item>
                        <Descriptions.Item label="数据访问策略">按角色授权+脱敏字段访问</Descriptions.Item>
                        <Descriptions.Item label="数据使用策略">仅支持授权分析任务使用</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="策略引用与配置">
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="订单编号">{decodeURIComponent(orderId || '')}</Descriptions.Item>
                        <Descriptions.Item label="订单状态"><Tag color={currentStatus === '已完成' ? 'green' : 'orange'}>{currentStatus}</Tag></Descriptions.Item>
                        <Descriptions.Item label="交付方式">中密交付</Descriptions.Item>
                        <Descriptions.Item label="可信环境模板">SGX-4C8G计算环境</Descriptions.Item>
                        <Descriptions.Item label="预处理规则">手机号掩码规则、日期标准化规则</Descriptions.Item>
                        <Descriptions.Item label="质量规则">字段非空率检查</Descriptions.Item>
                        <Descriptions.Item label="容器隔离策略">强隔离计算容器</Descriptions.Item>
                        <Descriptions.Item label="数据销毁策略">标准30天自动清理</Descriptions.Item>
                      </Descriptions>
                      <div className="mt-4">
                        <Text strong>字段绑定详情</Text>
                        <Table
                          size="small"
                          className="mt-2"
                          pagination={false}
                          rowKey="ability"
                          dataSource={[
                            { ability: '加密策略: 手机号AES加密', field: 'phone' },
                            { ability: '预处理规则: 日期标准化规则', field: 'pay_time' },
                            { ability: '质量规则: 字段非空率检查', field: 'phone' },
                          ]}
                          columns={[
                            { title: '策略能力', dataIndex: 'ability' },
                            { title: '绑定字段', dataIndex: 'field' },
                          ]}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'pipeline',
              label: '任务流水线',
              children: (
                <div className="space-y-4">
                  {pipelineRows.length === 0 ? (
                    <Empty description="暂无任务信息" />
                  ) : (
                    <Timeline
                      items={pipelineRows.map((p) => ({
                      children: (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Text strong>{p.title}</Text>
                            <Tag>{p.type}</Tag>
                            <Tag color={p.status === '已完成' ? 'green' : p.status === '执行中' ? 'orange' : 'default'}>
                              {p.status}
                            </Tag>
                            <Text type="secondary">开始时间：{p.startTime}</Text>
                            <Text type="secondary">进度：{p.progress}</Text>
                          </div>
                          <Space>
                            <Button type="link" onClick={() => { setSelectedTask(p); setTaskDrawerOpen(true); }}>任务详情</Button>
                            <Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(orderId || '')}/tasks/${encodeURIComponent(p.taskId)}/logs`)}>查看日志</Button>
                          </Space>
                        </div>
                      ),
                    }))}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'log',
              label: '交付日志',
              children: (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Space>
                      <Select
                        allowClear
                        placeholder="操作类型"
                        style={{ width: 160 }}
                        options={['系统', '任务', '告警'].map((x) => ({ label: x, value: x }))}
                        onChange={setLogType}
                      />
                      <Select
                        allowClear
                        placeholder="时间范围"
                        style={{ width: 150 }}
                        options={[{ label: '今天', value: 'today' }]}
                        onChange={setLogRange}
                      />
                    </Space>
                    <Button onClick={() => message.success('日志导出成功')}>导出日志</Button>
                  </div>
                  <Table
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    dataSource={filteredLogs}
                    columns={[
                      { title: '时间', dataIndex: 'time' },
                      { title: '操作类型', dataIndex: 'action' },
                      { title: '操作者', dataIndex: 'operator' },
                      { title: '详细信息', dataIndex: 'detail' },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
        )}
      </Card>

      <Space>
        {currentStatus === '执行中' && (
          <Button danger onClick={() => message.success('订单已取消')}>取消订单</Button>
        )}
        {currentStatus === '已完成' && <Button onClick={() => message.success('交付结果导出成功')}>导出结果</Button>}
      </Space>

      <Drawer
        width={560}
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        title={`任务详情：${selectedTask?.taskId || ''}`}
      >
        {selectedTask ? (
          <div className="space-y-4">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="任务名称">{selectedTask.title}</Descriptions.Item>
              <Descriptions.Item label="任务类型">{selectedTask.type}</Descriptions.Item>
              <Descriptions.Item label="状态">{selectedTask.status}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedTask.startTime}</Descriptions.Item>
              <Descriptions.Item label="当前进度">{selectedTask.progress}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="执行日志摘要">
              <p>{selectedTask.log}</p>
            </Card>
          </div>
        ) : (
          <Empty description="暂无任务详情" />
        )}
      </Drawer>
    </div>
  );
};

export default DeliveryOrderDetail;

