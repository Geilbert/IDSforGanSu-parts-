import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Steps, Table, Tag, Typography, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type OrderStatus = '草稿' | '已创建' | '执行中' | '已完成' | '已失败' | '已取消';
type DeliveryMode = '低密交付' | '中密交付';

interface OrderRow {
  id: string;
  name: string;
  mode: DeliveryMode;
  status: OrderStatus;
  createdAt: string;
  sourceConnector: string;
  dataProduct: string;
  targetConnector: string;
  policyName: string;
}

const mockOrders: OrderRow[] = [
  { id: 'OD-20260413-001', name: '财务流水共享订单', mode: '低密交付', status: '已完成', createdAt: '2026-04-13 09:10', sourceConnector: 'MySQL_Finance_Master', dataProduct: 'User_Transaction_Records', targetConnector: 'S3_Assets_Bucket', policyName: '低密-标准传输模板' },
  { id: 'OD-20260413-002', name: '客户画像计算订单', mode: '中密交付', status: '执行中', createdAt: '2026-04-13 10:20', sourceConnector: 'Oracle_CRM_Replica', dataProduct: 'Customer_Profile_Master', targetConnector: 'Local_File_Server', policyName: '中密-可信计算模板A' },
  { id: 'OD-20260413-003', name: '商品目录分发订单', mode: '低密交付', status: '已失败', createdAt: '2026-04-13 11:35', sourceConnector: 'S3_Assets_Bucket', dataProduct: 'Global_Product_Catalog', targetConnector: 'MySQL_Finance_Master', policyName: '低密-增量分发模板' },
  { id: 'OD-20260413-004', name: '试验草稿订单', mode: '中密交付', status: '草稿', createdAt: '2026-04-13 12:05', sourceConnector: 'MySQL_Finance_Master', dataProduct: 'Core_Algorithm_Params', targetConnector: 'Local_File_Server', policyName: '中密-高审计模板' },
];

const statusColor: Record<OrderStatus, string> = {
  草稿: 'default',
  已创建: 'blue',
  执行中: 'orange',
  已完成: 'green',
  已失败: 'red',
  已取消: 'default',
};

const lowPolicies = ['低密-标准传输模板', '低密-增量分发模板', '低密-文件快传模板'];
const highPolicies = ['中密-可信计算模板A', '中密-高审计模板', '中密-脱敏计算模板'];

const DeliveryOrders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);
  const [filterForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<OrderRow | null>(null);

  const quickStatus = searchParams.get('status') as OrderStatus | null;
  const quickOpenCreate = searchParams.get('create') === '1';

  React.useEffect(() => {
    if (quickStatus) filterForm.setFieldValue('status', [quickStatus]);
    if (quickOpenCreate) {
      setOpen(true);
      createForm.resetFields();
    }
  }, [quickStatus, quickOpenCreate, filterForm, createForm]);

  const modeWatch = Form.useWatch('mode', createForm) as DeliveryMode | undefined;

  const data = useMemo(() => {
    const v = filterForm.getFieldsValue();
    const id = (v.id || '').trim();
    const status = (v.status || []) as OrderStatus[];
    const mode = v.mode as DeliveryMode | undefined;
    const time = v.time as [Dayjs, Dayjs] | undefined;
    return orders.filter((o) => {
      if (id && !o.id.includes(id)) return false;
      if (status.length > 0 && !status.includes(o.status)) return false;
      if (mode && o.mode !== mode) return false;
      if (time) {
        const t = dayjs(o.createdAt, 'YYYY-MM-DD HH:mm');
        if (t.isBefore(time[0]) || t.isAfter(time[1])) return false;
      }
      return true;
    });
  }, [orders, filterForm]);

  const onQuery = () => filterForm.setFieldsValue({ ...filterForm.getFieldsValue() });
  const onReset = () => {
    filterForm.resetFields();
    onQuery();
  };

  const openCreate = () => {
    setEditing(null);
    createForm.resetFields();
    setStep(0);
    setOpen(true);
  };

  const onEdit = (row: OrderRow) => {
    setEditing(row);
    createForm.setFieldsValue({
      sourceConnector: row.sourceConnector,
      dataProduct: row.dataProduct,
      targetConnector: row.targetConnector,
      mode: row.mode,
      policyName: row.policyName,
      orderName: row.name,
    });
    setStep(0);
    setOpen(true);
  };

  const next = async () => {
    if (step === 0) await createForm.validateFields(['sourceConnector', 'dataProduct', 'targetConnector']);
    if (step === 1) await createForm.validateFields(['mode', 'policyName', 'orderName']);
    setStep((s) => Math.min(2, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    const v = await createForm.validateFields();
    if (editing) {
      setOrders((prevList) =>
        prevList.map((o) =>
          o.id === editing.id
            ? { ...o, mode: v.mode, policyName: v.policyName, name: v.orderName, targetConnector: v.targetConnector }
            : o,
        ),
      );
      message.success('订单已更新');
    } else {
      const newOrder: OrderRow = {
        id: `OD-${dayjs().format('YYYYMMDD-HHmmss')}`,
        name: v.orderName,
        mode: v.mode,
        status: '已创建',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        sourceConnector: v.sourceConnector,
        dataProduct: v.dataProduct,
        targetConnector: v.targetConnector,
        policyName: v.policyName,
      };
      setOrders((prevList) => [newOrder, ...prevList]);
      message.success('订单创建成功，任务流水线已生成');
    }
    setOpen(false);
  };

  const cancelOrder = (row: OrderRow) => {
    Modal.confirm({
      title: '确认取消订单',
      content: `确定要取消订单 ${row.id} 吗？`,
      onOk: () => {
        setOrders((prevList) => prevList.map((o) => (o.id === row.id ? { ...o, status: '已取消' } : o)));
        message.success('订单已取消');
      },
    });
  };

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>
        交付订单
      </Title>
      <Card size="small">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-y-2">
          <Form.Item name="id" label="订单编号">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select mode="multiple" allowClear style={{ width: 220 }} options={Object.keys(statusColor).map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="mode" label="交付方式">
            <Select allowClear style={{ width: 140 }} options={[{ label: '低密交付', value: '低密交付' }, { label: '中密交付', value: '中密交付' }]} />
          </Form.Item>
          <Form.Item name="time" label="时间范围">
            <RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={onQuery}>查询</Button>
              <Button onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card size="small">
        <div className="mb-3">
          <Button type="primary" onClick={openCreate}>
            创建智能订单
          </Button>
        </div>
        <Table
          rowKey="id"
          dataSource={data}
          columns={[
            { title: '订单编号', dataIndex: 'id', render: (id: string) => <Button type="link" className="px-0" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(id)}`)}>{id}</Button> },
            { title: '订单名称', dataIndex: 'name' },
            { title: '交付方式', dataIndex: 'mode', render: (m: DeliveryMode) => <Tag color={m === '低密交付' ? 'blue' : 'purple'}>{m}</Tag> },
            { title: '状态', dataIndex: 'status', render: (s: OrderStatus) => <Tag color={statusColor[s]}>{s}</Tag> },
            { title: '创建时间', dataIndex: 'createdAt' },
            {
              title: '操作',
              render: (_: unknown, row: OrderRow) => (
                <Space>
                  <Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.id)}`)}>详情</Button>
                  {row.status === '草稿' && <Button type="link" onClick={() => onEdit(row)}>编辑</Button>}
                  {(row.status === '已创建' || row.status === '执行中') && <Button type="link" danger onClick={() => cancelOrder(row)}>取消</Button>}
                  {row.status === '已完成' && <Button type="link" onClick={() => message.success('交付结果已导出')}>导出结果</Button>}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        width={820}
        open={open}
        title={editing ? '编辑智能订单' : '创建智能订单'}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            {step > 0 && <Button onClick={prev}>上一步</Button>}
            {step < 2 ? <Button type="primary" onClick={() => void next()}>下一步</Button> : <Button type="primary" onClick={() => void submit()}>提交</Button>}
          </Space>
        }
      >
        <Steps current={step} className="mb-4" items={[{ title: '选择数据与接收方' }, { title: '配置交付' }, { title: '确认提交' }]} />
        <Form form={createForm} layout="vertical" initialValues={{ mode: '低密交付' }}>
          {step === 0 && (
            <>
              <Form.Item name="sourceConnector" label="源连接器" rules={[{ required: true }]}><Select options={['MySQL_Finance_Master', 'Oracle_CRM_Replica', 'S3_Assets_Bucket'].map((x) => ({ label: x, value: x }))} /></Form.Item>
              <Form.Item name="dataProduct" label="数据产品" rules={[{ required: true }]}><Select options={['User_Transaction_Records', 'Customer_Profile_Master', 'Global_Product_Catalog'].map((x) => ({ label: x, value: x }))} /></Form.Item>
              <Form.Item name="targetConnector" label="目标连接器" rules={[{ required: true }]}><Select options={['Local_File_Server', 'S3_Assets_Bucket', 'MySQL_Finance_Master'].map((x) => ({ label: x, value: x }))} /></Form.Item>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item name="mode" label="交付方式" rules={[{ required: true }]}><Select options={[{ label: '低密交付', value: '低密交付' }, { label: '中密交付', value: '中密交付' }]} /></Form.Item>
              <Form.Item name="policyName" label="策略组合" rules={[{ required: true }]}><Select options={(modeWatch === '中密交付' ? highPolicies : lowPolicies).map((x) => ({ label: x, value: x }))} /></Form.Item>
              <Form.Item name="orderName" label="订单名称" rules={[{ required: true }]}><Input /></Form.Item>
            </>
          )}
          {step === 2 && (
            <Card size="small" className="bg-gray-50">
              <p><Text strong>源连接器：</Text>{createForm.getFieldValue('sourceConnector')}</p>
              <p><Text strong>数据产品：</Text>{createForm.getFieldValue('dataProduct')}</p>
              <p><Text strong>目标连接器：</Text>{createForm.getFieldValue('targetConnector')}</p>
              <p><Text strong>交付方式：</Text>{createForm.getFieldValue('mode')}</p>
              <p><Text strong>策略组合：</Text>{createForm.getFieldValue('policyName')}</p>
              <p><Text strong>订单名称：</Text>{createForm.getFieldValue('orderName')}</p>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryOrders;

