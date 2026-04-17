import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Col, DatePicker, List, Modal, Row, Select, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import { Line, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type WorkbenchTabKey = 'realtime' | 'history' | 'exception';
type DeliveryModeFilter = '全部' | '低密' | '中密';
type TaskStatusFilter = '全部' | '成功' | '失败';

interface FeedEvent {
  id: string;
  text: string;
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
  taskId: string;
  taskName: string;
  orderId: string;
  deliveryMode: '低密' | '中密';
  taskType: string;
  status: '成功' | '失败';
  startedAt: string;
  endedAt: string;
  dataSize: string;
}

interface ExceptionRow {
  key: string;
  objectType: '订单' | '任务';
  objectId: string;
  level: '严重' | '警告';
  desc: string;
  occurredAt: string;
  handleStatus: '待处理' | '已处理';
  retryable: boolean;
  orderId: string;
  taskId?: string;
}

const trendData = [
  { date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), successRate: 95.2, totalOrders: 31, failedOrders: 2 },
  { date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), successRate: 96.1, totalOrders: 29, failedOrders: 1 },
  { date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), successRate: 94.8, totalOrders: 34, failedOrders: 2 },
  { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), successRate: 97.4, totalOrders: 32, failedOrders: 1 },
  { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), successRate: 96.9, totalOrders: 30, failedOrders: 1 },
  { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), successRate: 98.0, totalOrders: 33, failedOrders: 1 },
  { date: dayjs().format('YYYY-MM-DD'), successRate: 97.2, totalOrders: 32, failedOrders: 1 },
];

const realtimeFeed: FeedEvent[] = [
  { id: 'f1', text: '订单 OD-20260413-001 已完成交付', type: 'order', orderId: 'OD-20260413-001' },
  { id: 'f2', text: '文件传输任务 T-102121 失败告警', type: 'task', orderId: 'OD-20260413-003', taskId: 'T-102121' },
  { id: 'f3', text: '任务 T-102201 进入合约执行阶段', type: 'task', orderId: 'OD-20260413-002', taskId: 'T-102201' },
  { id: 'f4', text: '订单 OD-20260413-004 创建成功', type: 'order', orderId: 'OD-20260413-004' },
];

const historyTasks: HistoryTaskRow[] = [
  { taskId: 'T-102121', taskName: '文件传输-财务流水', orderId: 'OD-20260413-003', deliveryMode: '低密', taskType: '文件传输', status: '失败', startedAt: '2026-04-13 09:12', endedAt: '2026-04-13 09:28', dataSize: '32GB' },
  { taskId: 'T-102201', taskName: '中密合约执行', orderId: 'OD-20260413-002', deliveryMode: '中密', taskType: '合约执行', status: '成功', startedAt: '2026-04-13 10:20', endedAt: '2026-04-13 10:42', dataSize: '12GB' },
  { taskId: 'T-102205', taskName: '质量稽核-客户画像', orderId: 'OD-20260413-002', deliveryMode: '中密', taskType: '质量稽核', status: '成功', startedAt: '2026-04-13 10:50', endedAt: '2026-04-13 11:08', dataSize: '8GB' },
  { taskId: 'T-102311', taskName: '低密调度任务', orderId: 'OD-20260412-010', deliveryMode: '低密', taskType: '调度', status: '成功', startedAt: '2026-04-12 14:03', endedAt: '2026-04-12 14:10', dataSize: '4GB' },
  { taskId: 'T-102455', taskName: '数据清洗批处理', orderId: 'OD-20260411-006', deliveryMode: '中密', taskType: '数据清洗', status: '失败', startedAt: '2026-04-11 13:20', endedAt: '2026-04-11 13:54', dataSize: '20GB' },
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
    { key: 'ex_1', objectType: '任务', objectId: 'T-102121', level: '严重', desc: '文件传输链路中断，重试3次失败', occurredAt: '2026-04-13 09:28:00', handleStatus: '待处理', retryable: true, orderId: 'OD-20260413-003', taskId: 'T-102121' },
    { key: 'ex_2', objectType: '订单', objectId: 'OD-20260413-007', level: '警告', desc: '目标端目录权限不足，待人工确认', occurredAt: '2026-04-13 10:15:00', handleStatus: '待处理', retryable: false, orderId: 'OD-20260413-007' },
    { key: 'ex_3', objectType: '任务', objectId: 'T-102455', level: '严重', desc: '中密计算环境初始化失败', occurredAt: '2026-04-12 13:54:00', handleStatus: '已处理', retryable: true, orderId: 'OD-20260411-006', taskId: 'T-102455' },
  ]);
  const [draftFilters, setDraftFilters] = React.useState({
    range: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs],
    mode: '全部' as DeliveryModeFilter,
    taskType: '全部',
    status: '全部' as TaskStatusFilter,
  });
  const [appliedFilters, setAppliedFilters] = React.useState(draftFilters);

  const pieData = [
    { type: '成功', value: 72 },
    { type: '执行中', value: 18 },
    { type: '失败', value: 10 },
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
      const started = dayjs(item.startedAt, 'YYYY-MM-DD HH:mm');
      if (started.isBefore(appliedFilters.range[0]) || started.isAfter(appliedFilters.range[1])) return false;
      if (appliedFilters.mode !== '全部' && item.deliveryMode !== appliedFilters.mode) return false;
      if (appliedFilters.taskType !== '全部' && item.taskType !== appliedFilters.taskType) return false;
      if (appliedFilters.status !== '全部' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [appliedFilters]);

  const failedTaskRows = React.useMemo(() => {
    return historyTasks.filter((item) => item.status === '失败');
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
                      <Button type="link" className="px-0" onClick={() => onRealtimeFeedClick(item)}>
                        {item.text}
                      </Button>
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
                        options={['全部', '文件传输', '数据库传输', '调度', '可信计算', '环境构建', '质量稽核', '合约执行', '数据清洗'].map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setDraftFilters((prev) => ({ ...prev, taskType: value }))}
                      />
                      <Select
                        value={draftFilters.status}
                        style={{ width: 120 }}
                        options={['全部', '成功', '失败'].map((item) => ({ label: item, value: item }))}
                        onChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value as TaskStatusFilter }))}
                      />
                      <Button type="primary" onClick={() => setAppliedFilters(draftFilters)}>搜索</Button>
                    </Space>
                  </Card>
                  <Table
                    rowKey="taskId"
                    dataSource={filteredHistoryTasks}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      { title: '任务ID/名称', key: 'taskInfo', render: (_, row: HistoryTaskRow) => <span>{row.taskId} / {row.taskName}</span> },
                      { title: '关联订单号', dataIndex: 'orderId' },
                      { title: '交付方式', dataIndex: 'deliveryMode', render: (mode: string) => <Tag color={mode === '低密' ? 'blue' : 'purple'}>{mode}</Tag> },
                      { title: '任务类型', dataIndex: 'taskType' },
                      { title: '状态', dataIndex: 'status', render: (status: string) => <Tag color={status === '成功' ? 'green' : 'red'}>{status}</Tag> },
                      { title: '开始时间', dataIndex: 'startedAt', sorter: (a: HistoryTaskRow, b: HistoryTaskRow) => dayjs(a.startedAt).valueOf() - dayjs(b.startedAt).valueOf() },
                      { title: '结束时间', dataIndex: 'endedAt' },
                      { title: '数据量', dataIndex: 'dataSize' },
                      { title: '操作', render: (_, row: HistoryTaskRow) => <Button type="link" onClick={() => message.success(`已打开任务 ${row.taskId} 报告`)}>查看报告</Button> },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'exception',
              label: <span className={activeWorkbenchTab === 'exception' ? 'text-red-500 font-medium' : ''}>异常记录</span>,
              children: (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => message.success('异常报告导出成功')}>导出异常报告</Button>
                  </div>
                  <Table
                    rowKey="key"
                    dataSource={exceptionRows}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      { title: '异常对象', render: (_, row: ExceptionRow) => `${row.objectType}-${row.objectId}` },
                      { title: '异常级别', dataIndex: 'level', render: (level: ExceptionRow['level']) => <Tag color={level === '严重' ? 'red' : 'orange'}>{level}</Tag> },
                      { title: '异常描述', dataIndex: 'desc' },
                      { title: '发生时间', dataIndex: 'occurredAt' },
                      { title: '处理状态', dataIndex: 'handleStatus', render: (status: ExceptionRow['handleStatus']) => <Tag color={status === '待处理' ? 'gold' : 'green'}>{status}</Tag> },
                      {
                        title: '操作',
                        render: (_, row: ExceptionRow) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.orderId)}/tasks/${encodeURIComponent(row.taskId || 'unknown')}/logs`)}
                            >
                              查看详情
                            </Button>
                            {row.retryable && row.handleStatus === '待处理' && (
                              <Button type="link" onClick={() => message.success(`任务 ${row.objectId} 已加入重试队列`)}>重试</Button>
                            )}
                            {row.handleStatus === '待处理' && (
                              <Button
                                type="link"
                                onClick={() =>
                                  setExceptionRows((prev) =>
                                    prev.map((item) => (item.key === row.key ? { ...item, handleStatus: '已处理' } : item)),
                                  )
                                }
                              >
                                标记处理
                              </Button>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
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
              color={['#52c41a', '#faad14', '#ff4d4f']}
              interactions={[{ type: 'element-active' }]}
              onReady={(plot) => {
                plot.on('element:click', (ev: any) => {
                  const datum = (ev.data as { data?: { type?: string } })?.data;
                  if (datum?.type === '失败') {
                    setFailedTaskOpen(true);
                  }
                });
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="健康度监控 - 交付成功率趋势图">
            <div className="space-y-2">
              <Line
                data={trendData}
                xField="date"
                yField="successRate"
                height={250}
                point={{ size: 4, shape: 'circle' }}
                smooth
                yAxis={{ min: 90, max: 100, title: { text: '成功率(%)' } }}
                xAxis={{ title: { text: '近7日' } }}
                tooltip={{
                  customContent: (_: string, items: any[]) => {
                    const datum = items?.[0]?.data as (typeof trendData)[number] | undefined;
                    if (!datum) return '';
                    return `<div style="padding:8px;">
                      <div>日期：${datum.date}</div>
                      <div>成功率：${datum.successRate}%</div>
                      <div>当日总订单数：${datum.totalOrders}</div>
                      <div>失败订单数：${datum.failedOrders}</div>
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
          rowKey="taskId"
          dataSource={failedTaskRows}
          pagination={false}
          columns={[
            { title: '任务ID', dataIndex: 'taskId' },
            { title: '类型', dataIndex: 'taskType' },
            { title: '失败时间', dataIndex: 'endedAt' },
            { title: '失败原因摘要', render: (_, row: HistoryTaskRow) => `${row.taskType}执行失败，请检查上下游链路` },
            {
              title: '操作',
              render: (_, row: HistoryTaskRow) => (
                <Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.orderId)}/tasks/${encodeURIComponent(row.taskId)}/logs`)}>
                  查看日志
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

