import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Col, DatePicker, List, Modal, Row, Select, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import { Line, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type WorkbenchTabKey = 'realtime' | 'history' | 'exception';
type DeliveryModeFilter = '全部' | '低密' | '中密';
type TaskStatusFilter = '全部' | '生效' | '失效';

interface FeedEvent {
  id: string;
  occurredAt: string;
  action: '发出告警' | '创建交付订单' | '订单失效';
  target: string;
  type: 'order' | 'task';
  orderId: string;
  taskId?: string;
}

interface RealtimeTask {
  taskId: string;
  taskType: string;
  orderId: string;
  status: string;
  progress: string;
  startedAt: string;
  eta: string;
}

interface HistoryTaskRow {
  orderId: string;
  contractId: string;
  deliveryMode: '低密' | '中密';
  dataType: string;
  status: '生效' | '失效';
  contractStartAt: string;
  contractEndAt: string;
  deliveryCount: number;
}

interface ExceptionRow {
  key: string;
  alertTime: string;
  productName: string;
  ruleType: string;
  alertStatus: '成功' | '失败' | '处理中';
}

const trendData = [
  { date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), alertCount: 6, severeCount: 2, warningCount: 4 },
  { date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), alertCount: 4, severeCount: 1, warningCount: 3 },
  { date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), alertCount: 7, severeCount: 3, warningCount: 4 },
  { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), alertCount: 5, severeCount: 2, warningCount: 3 },
  { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), alertCount: 3, severeCount: 1, warningCount: 2 },
  { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), alertCount: 8, severeCount: 3, warningCount: 5 },
  { date: dayjs().format('YYYY-MM-DD'), alertCount: 4, severeCount: 1, warningCount: 3 },
];

const realtimeFeed: FeedEvent[] = [
  {
    id: 'f1',
    occurredAt: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    action: '发出告警',
    target: '任务 T-102121 文件传输链路中断，已触发告警',
    type: 'task',
    orderId: 'OD-20260413-003',
    taskId: 'T-102121',
  },
  {
    id: 'f2',
    occurredAt: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    action: '创建交付订单',
    target: '订单 OD-20260413-004 已创建并进入调度队列',
    type: 'order',
    orderId: 'OD-20260413-004',
  },
  {
    id: 'f3',
    occurredAt: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    action: '订单失效',
    target: '订单 OD-20260412-018 超过有效期，状态已变更为失效',
    type: 'order',
    orderId: 'OD-20260412-018',
  },
  {
    id: 'f4',
    occurredAt: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    action: '发出告警',
    target: '订单 OD-20260413-007 目标端权限不足，待人工处理',
    type: 'order',
    orderId: 'OD-20260413-007',
  },
];

const historyTasks: HistoryTaskRow[] = [
  { orderId: 'OD-20260413-003', contractId: 'ODRL-CN-10021', deliveryMode: '低密', dataType: '文件', status: '失效', contractStartAt: '2026-04-13 09:12', contractEndAt: '2026-04-13 09:28', deliveryCount: 1 },
  { orderId: 'OD-20260413-002', contractId: 'ODRL-CN-10022', deliveryMode: '中密', dataType: '结构化数据', status: '生效', contractStartAt: '2026-04-13 10:20', contractEndAt: '2026-04-13 10:42', deliveryCount: 2 },
  { orderId: 'OD-20260413-008', contractId: 'ODRL-CN-10023', deliveryMode: '中密', dataType: '结构化数据', status: '生效', contractStartAt: '2026-04-13 10:50', contractEndAt: '2026-04-13 11:08', deliveryCount: 1 },
  { orderId: 'OD-20260412-010', contractId: 'ODRL-CN-10021', deliveryMode: '低密', dataType: '文件', status: '生效', contractStartAt: '2026-04-12 14:03', contractEndAt: '2026-04-12 14:10', deliveryCount: 3 },
  { orderId: 'OD-20260411-006', contractId: 'ODRL-CN-10024', deliveryMode: '中密', dataType: '混合数据', status: '失效', contractStartAt: '2026-04-11 13:20', contractEndAt: '2026-04-11 13:54', deliveryCount: 1 },
];

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeWorkbenchTab, setActiveWorkbenchTab] = React.useState<WorkbenchTabKey>('realtime');
  const [loadingRealtimeTask, setLoadingRealtimeTask] = React.useState(false);
  const [realtimeTaskOpen, setRealtimeTaskOpen] = React.useState(false);
  const [realtimeTaskLevel, setRealtimeTaskLevel] = React.useState<'低密' | '中密'>('低密');
  const [realtimeTaskRows, setRealtimeTaskRows] = React.useState<RealtimeTask[]>([]);
  const [failedTaskOpen, setFailedTaskOpen] = React.useState(false);
  const [exceptionRows, setExceptionRows] = React.useState<ExceptionRow[]>([
    { key: 'ex_1', alertTime: '2026-04-13 09:28:00', productName: '数据交付平台', ruleType: '链路可用性规则', alertStatus: '失败' },
    { key: 'ex_2', alertTime: '2026-04-13 10:15:00', productName: '数据交付平台', ruleType: '权限校验规则', alertStatus: '处理中' },
    { key: 'ex_3', alertTime: '2026-04-12 13:54:00', productName: '中密交付引擎', ruleType: '环境初始化规则', alertStatus: '成功' },
  ]);
  const [draftFilters, setDraftFilters] = React.useState({
    range: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs],
    mode: '全部' as DeliveryModeFilter,
    taskType: '全部',
    status: '全部' as TaskStatusFilter,
  });
  const [appliedFilters, setAppliedFilters] = React.useState(draftFilters);

  const pieData = [
    { type: '生效', value: 52 },
    { type: '失效', value: 11 },
    { type: '执行中', value: 24 },
    { type: '待生效', value: 13 },
  ];
  const lowTaskStatus = [
    { label: '传输中', value: 6 },
    { label: '加密中', value: 3 },
    { label: '待调度', value: 1 },
  ];
  const highTaskStatus = [
    { label: '计算中', value: 2 },
    { label: '环境构建', value: 1 },
    { label: '质量稽核', value: 2 },
    { label: '合约执行', value: 1 },
  ];

  const filteredHistoryTasks = React.useMemo(() => {
    return historyTasks.filter((item) => {
      const started = dayjs(item.contractStartAt, 'YYYY-MM-DD HH:mm');
      if (started.isBefore(appliedFilters.range[0]) || started.isAfter(appliedFilters.range[1])) return false;
      if (appliedFilters.mode !== '全部' && item.deliveryMode !== appliedFilters.mode) return false;
      if (appliedFilters.taskType !== '全部' && item.dataType !== appliedFilters.taskType) return false;
      if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [appliedFilters]);

  const failedTaskRows = React.useMemo(() => {
    return historyTasks.filter((item) => item.status === '失效');
  }, []);

  const openRealtimeTaskPanel = async (level: '低密' | '中密') => {
    setRealtimeTaskLevel(level);
    setRealtimeTaskOpen(true);
    setLoadingRealtimeTask(true);

    // 模拟调用实时任务API
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (level === '低密') {
      setRealtimeTaskRows([
        { taskId: 'T-L001', taskType: '文件传输', orderId: 'OD-20260413-010', status: '传输中', progress: '65%', startedAt: '2026-04-13 09:10:00', eta: '18分钟' },
        { taskId: 'T-L002', taskType: '数据库传输', orderId: 'OD-20260413-011', status: '加密中', progress: '42%', startedAt: '2026-04-13 09:22:00', eta: '26分钟' },
        { taskId: 'T-L003', taskType: '文件传输', orderId: 'OD-20260413-012', status: '待调度', progress: '5%', startedAt: '2026-04-13 09:30:00', eta: '33分钟' },
      ]);
    } else {
      setRealtimeTaskRows([
        { taskId: 'T-M001', taskType: '可信计算', orderId: 'OD-20260413-020', status: '计算中', progress: '55%', startedAt: '2026-04-13 09:03:00', eta: '35分钟' },
        { taskId: 'T-M002', taskType: '环境构建', orderId: 'OD-20260413-021', status: '环境构建', progress: '30%', startedAt: '2026-04-13 09:25:00', eta: '45分钟' },
        { taskId: 'T-M003', taskType: '质量稽核', orderId: 'OD-20260413-022', status: '质量稽核', progress: '60%', startedAt: '2026-04-13 09:18:00', eta: '22分钟' },
      ]);
    }
    setLoadingRealtimeTask(false);
  };

  const onRealtimeFeedClick = (event: FeedEvent) => {
    if (event.type === 'order') {
      navigate(`/delivery/orders/${encodeURIComponent(event.orderId)}`);
      return;
    }
    navigate(`/delivery/orders/${encodeURIComponent(event.orderId)}/tasks/${encodeURIComponent(event.taskId || 'unknown')}/logs`);
  };

  const onTrendPointClick = (date: string) => {
    const dayStart = dayjs(date).startOf('day');
    const dayEnd = dayjs(date).endOf('day');
    const nextFilters = {
      ...draftFilters,
      range: [dayStart, dayEnd] as [Dayjs, Dayjs],
    };
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setActiveWorkbenchTab('history');
  };

  return (
    <div className="space-y-5">
      <Title level={4} style={{ margin: 0 }}>交付看板</Title>

      <Card size="small" title="核心指标与进度监控">
        <Row gutter={16}>
          <Col span={6}>
            <Card
              hoverable
              size="small"
              onClick={() => navigate('/delivery/orders?today=1&toast=todayOrders')}
              className="h-full cursor-pointer"
            >
              <Statistic title="今日订单总数" value={32} />
              <Text type="secondary">同比 +12%</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable size="small" className="h-full cursor-pointer border-blue-200" onClick={() => void openRealtimeTaskPanel('低密')}>
              <Text strong className="text-blue-600">低密交付中</Text>
              <div className="mt-2 text-3xl font-semibold text-blue-600">10</div>
              <Space size={[6, 6]} wrap className="mt-3">
                {lowTaskStatus.map((item) => (
                  <Tag key={item.label} color="blue">{item.label}:{item.value}</Tag>
                ))}
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable size="small" className="h-full cursor-pointer border-purple-200" onClick={() => void openRealtimeTaskPanel('中密')}>
              <Text strong className="text-purple-600">中密交付中</Text>
              <div className="mt-2 text-3xl font-semibold text-purple-600">6</div>
              <Space size={[6, 6]} wrap className="mt-3">
                {highTaskStatus.map((item) => (
                  <Tag key={item.label} color="purple">{item.label}:{item.value}</Tag>
                ))}
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              size="small"
              className="h-full cursor-pointer border-red-200"
              onClick={() => setActiveWorkbenchTab('exception')}
            >
              <Text strong>近24小时异常</Text>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-semibold text-red-500">3</span>
                <Badge status="error" text="告警" />
              </div>
              <Text type="secondary">点击可切换至异常记录</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="交付工作台">
        <Tabs
          activeKey={activeWorkbenchTab}
          onChange={(key) => setActiveWorkbenchTab(key as WorkbenchTabKey)}
          items={[
            {
              key: 'realtime',
              label: '实时动态',
              children: (
                <List
                  size="small"
                  dataSource={realtimeFeed}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text type="secondary">{item.occurredAt}</Text>
                        <Space size={8} wrap>
                          <Tag color={item.action === '发出告警' ? 'red' : item.action === '创建交付订单' ? 'blue' : 'orange'}>{item.action}</Tag>
                          <Button type="link" className="px-0" onClick={() => onRealtimeFeedClick(item)}>
                            {item.target}
                          </Button>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'history',
              label: '任务历史',
              children: (
                <div className="space-y-4">
                  <Card size="small" className="bg-gray-50">
                    <Space wrap>
                      <RangePicker
                        value={draftFilters.range}
                        onChange={(value) => {
                          if (value?.[0] && value?.[1]) {
                            setDraftFilters((prev) => ({ ...prev, range: [value[0], value[1]] as [Dayjs, Dayjs] }));
                          }
                        }}
                      />
                      <Select
                        value={draftFilters.mode}
                        style={{ width: 120 }}
                        options={['全部', '低密', '中密'].map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setDraftFilters((prev) => ({ ...prev, mode: value as DeliveryModeFilter }))}
                      />
                      <Select
                        value={draftFilters.taskType}
                        style={{ width: 150 }}
                        options={['全部', '文件', '结构化数据', '混合数据'].map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setDraftFilters((prev) => ({ ...prev, taskType: value }))}
                      />
                      <Select
                        value={draftFilters.status}
                        style={{ width: 120 }}
                        options={['全部', '生效', '失效'].map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value as TaskStatusFilter }))}
                      />
                      <Button type="primary" onClick={() => setAppliedFilters(draftFilters)}>搜索</Button>
                    </Space>
                  </Card>
                  <Table
                    rowKey="orderId"
                    dataSource={filteredHistoryTasks}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      { title: '订单号', dataIndex: 'orderId' },
                      { title: '关联合约号', dataIndex: 'contractId' },
                      { title: '交付方式', dataIndex: 'deliveryMode', render: (mode: string) => <Tag color={mode === '低密' ? 'blue' : 'purple'}>{mode}</Tag> },
                      { title: '数据类型', dataIndex: 'dataType' },
                      { title: '状态', dataIndex: 'status', render: (status: string) => <Tag color={status === '生效' ? 'green' : 'red'}>{status}</Tag> },
                      { title: '合约开始时间', dataIndex: 'contractStartAt', sorter: (a: HistoryTaskRow, b: HistoryTaskRow) => dayjs(a.contractStartAt).valueOf() - dayjs(b.contractStartAt).valueOf() },
                      { title: '合约结束时间', dataIndex: 'contractEndAt' },
                      { title: '交付次数', dataIndex: 'deliveryCount' },
                      { title: '操作', render: (_, row: HistoryTaskRow) => <Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.orderId)}`)}>详情</Button> },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'exception',
              label: <span className={activeWorkbenchTab === 'exception' ? 'text-red-500 font-medium' : ''}>异常记录</span>,
              children: (
                <Table
                  rowKey="key"
                  dataSource={exceptionRows}
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: '告警时间',
                      dataIndex: 'alertTime',
                      sorter: (a: ExceptionRow, b: ExceptionRow) => dayjs(a.alertTime).valueOf() - dayjs(b.alertTime).valueOf(),
                    },
                    { title: '产品名称', dataIndex: 'productName' },
                    { title: '规则类型', dataIndex: 'ruleType' },
                    {
                      title: '告警状态',
                      dataIndex: 'alertStatus',
                      render: (status: ExceptionRow['alertStatus']) => (
                        <Tag color={status === '成功' ? 'green' : status === '失败' ? 'red' : 'processing'}>
                          {status}
                        </Tag>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="健康度监控 - 任务状态分布图">
            <Pie
              data={pieData}
              angleField="value"
              colorField="type"
              innerRadius={0.62}
              height={250}
              label={{ text: 'value', style: { fontSize: 12 } }}
              legend={{ position: 'bottom' }}
              color={['#52c41a', '#ff4d4f', '#1677ff', '#faad14']}
              interactions={[{ type: 'element-active' }]}
              onReady={(plot) => {
                plot.on('element:click', (ev: any) => {
                  const datum = (ev.data as { data?: { type?: string } })?.data;
                  if (datum?.type) {
                    setFailedTaskOpen(true);
                  }
                });
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="健康度监控 - 交付告警趋势图">
            <div className="space-y-2">
              <Line
                data={trendData}
                xField="date"
                yField="alertCount"
                height={250}
                point={{ size: 4, shape: 'circle' }}
                smooth
                yAxis={{ min: 0, title: { text: '告警次数' } }}
                xAxis={{ title: { text: '近7日' } }}
                tooltip={{
                  customContent: (_: string, items: any[]) => {
                    const datum = items?.[0]?.data as (typeof trendData)[number] | undefined;
                    if (!datum) return '';
                    return `<div style="padding:8px;">
                      <div>日期：${datum.date}</div>
                      <div>当日告警总次数：${datum.alertCount}</div>
                      <div>严重告警：${datum.severeCount}</div>
                      <div>警告告警：${datum.warningCount}</div>
                    </div>`;
                  },
                }}
                onReady={(plot) => {
                  plot.on('element:click', (ev: any) => {
                    const datum = (ev.data as { data?: { date?: string } })?.data;
                    if (datum?.date) {
                      onTrendPointClick(datum.date);
                    }
                  });
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        open={realtimeTaskOpen}
        onCancel={() => setRealtimeTaskOpen(false)}
        footer={null}
        width={900}
        title={`${realtimeTaskLevel}交付实时任务`}
      >
        <Table
          rowKey="taskId"
          loading={loadingRealtimeTask}
          dataSource={realtimeTaskRows}
          pagination={false}
          columns={[
            { title: '任务ID', dataIndex: 'taskId' },
            { title: '任务类型', dataIndex: 'taskType' },
            { title: '关联订单', dataIndex: 'orderId' },
            { title: '当前状态', dataIndex: 'status' },
            { title: '进度', dataIndex: 'progress' },
            { title: '开始时间', dataIndex: 'startedAt' },
            { title: '预估耗时', dataIndex: 'eta' },
          ]}
        />
      </Modal>

      <Modal
        open={failedTaskOpen}
        onCancel={() => setFailedTaskOpen(false)}
        footer={null}
        width={900}
        title="失败任务列表"
      >
        <Table
          rowKey="orderId"
          dataSource={failedTaskRows}
          pagination={false}
          columns={[
            { title: '订单号', dataIndex: 'orderId' },
            { title: '数据类型', dataIndex: 'dataType' },
            { title: '失败时间', dataIndex: 'contractEndAt' },
            { title: '失败原因摘要', render: (_, row: HistoryTaskRow) => `${row.dataType}交付失败，请检查上下游链路` },
            {
              title: '操作',
              render: (_, row: HistoryTaskRow) => (
                <Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.orderId)}`)}>
                  详情
                </Button>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default DeliveryDashboard;

