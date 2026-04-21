import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, DatePicker, Empty, Form, Input, Modal, Radio, Select, Space, Steps, Table, Tag, Tooltip, Typography, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type OrderStatus = '草稿' | '生效' | '失效';
type DeliveryMode = '低密交付' | '中密交付';
type DataType = '文件' | '结构化数据';

interface OrderRow {
  id: string;
  name: string;
  contractId: string;
  contractName: string;
  mode: DeliveryMode;
  status: OrderStatus;
  createdAt: string;
  sourceConnector: string;
  sourceType: DataType;
  dataProduct: string;
  dataAccessPolicy: string;
  dataUsagePolicy: string;
  targetConnector: string;
  configSummary: string;
}
interface ContractOption {
  id: string; name: string; sourceConnector: string; targetConnector: string; dataProduct: string; dataType: DataType;
  accessPolicy: string; usagePolicy: string; recommendedMode: DeliveryMode;
}
interface GatewayTemplate {
  id: string; name: string; enabled: boolean; dataType: DataType; transmission: string; control: string; encryptStrategies: string[];
}
interface RuleTemplate { id: string; name: string; enabled: boolean; }

const productFields: Record<string, string[]> = {
  User_Transaction_Records: ['order_id', 'user_id', 'phone_number', 'id_no', 'amount'],
  Customer_Profile_Master: ['customer_id', 'phone', 'email', 'city', 'level'],
  Marketing_Media_Pack: ['file_name', 'file_size', 'checksum'],
  Device_Behavior_Stream: ['device_id', 'event_time', 'ip_address', 'app_version', 'event_type'],
  Supplier_Master_Data: ['supplier_id', 'supplier_name', 'bank_account', 'tax_no', 'contact_phone'],
  Finance_Daily_Snapshot: ['snapshot_date', 'account_id', 'balance', 'currency', 'region_code'],
};
const contractOptions: ContractOption[] = [
  { id: 'CT-20260401-000', name: '低密快速联调合约', sourceConnector: 'MySQL_Dev_Sandbox', targetConnector: 'S3_Dev_Bucket', dataProduct: 'Finance_Daily_Snapshot', dataType: '结构化数据', accessPolicy: '开发测试白名单只读', usagePolicy: '仅用于联调验证，24小时自动清理', recommendedMode: '低密交付' },
  { id: 'CT-20260401-001', name: '财务流水日同步合约', sourceConnector: 'MySQL_Finance_Master', targetConnector: 'S3_Assets_Bucket', dataProduct: 'User_Transaction_Records', dataType: '结构化数据', accessPolicy: '仅限业务部门按订单读取', usagePolicy: '禁止二次分发，留存30天', recommendedMode: '低密交付' },
  { id: 'CT-20260401-002', name: '客户画像联合分析合约', sourceConnector: 'Oracle_CRM_Replica', targetConnector: 'Local_File_Server', dataProduct: 'Customer_Profile_Master', dataType: '结构化数据', accessPolicy: '按角色授权+脱敏字段访问', usagePolicy: '仅支持授权分析任务使用', recommendedMode: '中密交付' },
  { id: 'CT-20260401-003', name: '营销素材文件包分发合约', sourceConnector: 'S3_Assets_Bucket', targetConnector: 'Local_File_Server', dataProduct: 'Marketing_Media_Pack', dataType: '文件', accessPolicy: '按目录权限授权', usagePolicy: '下载后不可共享，72小时销毁', recommendedMode: '低密交付' },
  { id: 'CT-20260401-004', name: '设备行为日志分析合约', sourceConnector: 'Kafka_Behavior_Bus', targetConnector: 'HDFS_Research_Zone', dataProduct: 'Device_Behavior_Stream', dataType: '结构化数据', accessPolicy: '按项目组白名单授权', usagePolicy: '仅用于风险分析模型训练', recommendedMode: '中密交付' },
  { id: 'CT-20260401-005', name: '供应商主数据同步合约', sourceConnector: 'PostgreSQL_SCM_Core', targetConnector: 'S3_BI_Landing', dataProduct: 'Supplier_Master_Data', dataType: '结构化数据', accessPolicy: '按角色只读授权', usagePolicy: '支持内部经营分析，不得外发', recommendedMode: '低密交付' },
];
const lowGateways: GatewayTemplate[] = [
  { id: 'gw_0', name: '低密快速联调网关-v1', enabled: true, dataType: '结构化数据', transmission: 'SFTP + 小批量同步', control: '联调优先级策略', encryptStrategies: ['账户号AES加密'] },
  { id: 'gw_1', name: '用户信息SFTP安全传输网关-v1', enabled: true, dataType: '结构化数据', transmission: 'SFTP + 增量同步', control: '高优先级实时传输策略', encryptStrategies: ['手机号AES加密', '身份证SM4加密'] },
  { id: 'gw_2', name: '订单JDBC同步网关-v2', enabled: true, dataType: '结构化数据', transmission: 'JDBC批处理', control: '夜间批处理策略', encryptStrategies: ['交易金额脱敏加密'] },
  { id: 'gw_3', name: '文件快传安全网关-v1', enabled: true, dataType: '文件', transmission: 'SFTP文件快传', control: '实时监控策略', encryptStrategies: [] },
  { id: 'gw_4', name: '对象存储批传网关-v3', enabled: true, dataType: '结构化数据', transmission: '对象存储批量拉取', control: '准实时调度策略', encryptStrategies: ['邮箱哈希脱敏', '银行卡号掩码'] },
  { id: 'gw_5', name: '离线文件归档网关-v2', enabled: true, dataType: '文件', transmission: '归档包分片上传', control: '低峰窗口传输策略', encryptStrategies: [] },
  { id: 'gw_6', name: '经营分析数据快传网关-v1', enabled: true, dataType: '结构化数据', transmission: 'SFTP + 全量快照', control: 'T+1日批处理策略', encryptStrategies: ['客户ID哈希化', '联系电话掩码'] },
  { id: 'gw_7', name: '供应链主数据同步网关-v1', enabled: true, dataType: '结构化数据', transmission: 'JDBC增量抽取', control: '主数据优先同步策略', encryptStrategies: ['银行账户SM4加密'] },
  { id: 'gw_8', name: '多媒体文件投递网关-v1', enabled: true, dataType: '文件', transmission: 'SFTP大文件断点续传', control: '传输失败自动重试策略', encryptStrategies: [] },
  { id: 'gw_9', name: '日志归集传输网关-v1', enabled: true, dataType: '结构化数据', transmission: '对象存储分区拉取', control: '按小时滚动调度策略', encryptStrategies: ['IP地址脱敏'] },
];
const mockGatewayTemplates: GatewayTemplate[] = [
  { id: 'mock_gw_1', name: '演示网关模板A（结构化）', enabled: true, dataType: '结构化数据', transmission: '演示批量同步', control: '演示调度策略', encryptStrategies: ['演示字段加密'] },
  { id: 'mock_gw_2', name: '演示网关模板B（文件）', enabled: true, dataType: '文件', transmission: '演示文件传输', control: '演示重试策略', encryptStrategies: [] },
];
const trustedEnvTemplates: RuleTemplate[] = [
  { id: 'tee_1', name: 'SGX-4C8G计算环境', enabled: true },
  { id: 'tee_2', name: '国产TEE基础环境', enabled: true },
  { id: 'tee_3', name: '高性能TEE-8C16G', enabled: true },
];
const preprocessRules: RuleTemplate[] = [
  { id: 'pre_1', name: '手机号掩码规则', enabled: true },
  { id: 'pre_2', name: '日期标准化规则', enabled: true },
  { id: 'pre_3', name: '邮箱脱敏规则', enabled: true },
  { id: 'pre_4', name: '地址标准化规则', enabled: true },
];
const qualityRules: RuleTemplate[] = [
  { id: 'q_1', name: '字段非空率检查', enabled: true },
  { id: 'q_2', name: '唯一性检查', enabled: true },
  { id: 'q_3', name: '格式合法性检查', enabled: true },
  { id: 'q_4', name: '枚举值有效性检查', enabled: true },
];
const lowEncryptionStrategyOptions = [
  '手机号AES加密',
  '身份证SM4加密',
  '邮箱哈希脱敏',
  '银行卡号掩码',
  'IP地址脱敏',
  '账户号AES加密',
  '演示字段加密',
];
const lowTransmissionControlOptions = [
  '高优先级实时传输策略',
  '夜间批处理策略',
  '准实时调度策略',
  '低峰窗口传输策略',
  '传输失败自动重试策略',
  '链路限流与熔断策略',
];
const containerRules: RuleTemplate[] = [
  { id: 'c_1', name: '强隔离计算容器', enabled: true },
  { id: 'c_2', name: '协作容器', enabled: true },
  { id: 'c_3', name: '审计增强隔离容器', enabled: true },
];
const destroyRules: RuleTemplate[] = [
  { id: 'd_1', name: '标准30天自动清理', enabled: true },
  { id: 'd_2', name: '应急立即销毁', enabled: true },
  { id: 'd_3', name: '按合约到期自动销毁', enabled: true },
];

const mockOrders: OrderRow[] = [
  { id: 'OD-20260413-001', name: '财务流水共享订单', contractId: 'CT-20260401-001', contractName: '财务流水日同步合约', mode: '低密交付', status: '生效', createdAt: '2026-04-13 09:10', sourceConnector: 'MySQL_Finance_Master', sourceType: '结构化数据', dataProduct: 'User_Transaction_Records', dataAccessPolicy: '仅限业务部门按订单读取', dataUsagePolicy: '禁止二次分发，留存30天', targetConnector: 'S3_Assets_Bucket', configSummary: '网关+加密映射' },
  { id: 'OD-20260413-002', name: '客户画像计算订单', contractId: 'CT-20260401-002', contractName: '客户画像联合分析合约', mode: '中密交付', status: '生效', createdAt: '2026-04-13 10:20', sourceConnector: 'Oracle_CRM_Replica', sourceType: '结构化数据', dataProduct: 'Customer_Profile_Master', dataAccessPolicy: '按角色授权+脱敏字段访问', dataUsagePolicy: '仅支持授权分析任务使用', targetConnector: 'Local_File_Server', configSummary: '可信环境+规则绑定' },
  { id: 'OD-20260413-003', name: '商品目录分发订单', contractId: 'CT-20260401-003', contractName: '营销素材文件包分发合约', mode: '低密交付', status: '失效', createdAt: '2026-04-13 11:35', sourceConnector: 'S3_Assets_Bucket', sourceType: '文件', dataProduct: 'Marketing_Media_Pack', dataAccessPolicy: '按目录权限授权', dataUsagePolicy: '下载后不可共享，72小时销毁', targetConnector: 'Local_File_Server', configSummary: '文件网关模板' },
  { id: 'OD-20260413-004', name: '试验草稿订单', contractId: 'CT-20260401-002', contractName: '客户画像联合分析合约', mode: '中密交付', status: '草稿', createdAt: '2026-04-13 12:05', sourceConnector: 'Oracle_CRM_Replica', sourceType: '结构化数据', dataProduct: 'Customer_Profile_Master', dataAccessPolicy: '按角色授权+脱敏字段访问', dataUsagePolicy: '仅支持授权分析任务使用', targetConnector: 'Local_File_Server', configSummary: '待装配策略' },
];
const statusColor: Record<OrderStatus, string> = { 草稿: 'default', 生效: 'green', 失效: 'red' };

const DeliveryOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);
  const [tableLoading, setTableLoading] = useState(true);
  const [filterForm] = Form.useForm();
  const [wizardForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasShownToastRef = React.useRef(false);

  const quickStatus = searchParams.get('status') as OrderStatus | null;
  const quickOpenCreate = searchParams.get('create') === '1';
  const quickToday = searchParams.get('today') === '1';
  const quickToast = searchParams.get('toast');

  React.useEffect(() => { const t = setTimeout(() => setTableLoading(false), 500); return () => clearTimeout(t); }, []);
  React.useEffect(() => {
    if (quickStatus) filterForm.setFieldValue('status', [quickStatus]);
    if (quickToday) filterForm.setFieldValue('time', [dayjs().startOf('day'), dayjs().endOf('day')]);
    if (quickOpenCreate) { setOpen(true); wizardForm.resetFields(); }
  }, [quickStatus, quickOpenCreate, quickToday, filterForm, wizardForm]);
  React.useEffect(() => {
    if (quickToast === 'todayOrders' && !hasShownToastRef.current) { message.success('已筛选出今日所有订单'); hasShownToastRef.current = true; }
  }, [quickToast, location.key]);

  const contractId = Form.useWatch('contractId', wizardForm) as string | undefined;
  const deliveryMode = Form.useWatch('deliveryMode', wizardForm) as DeliveryMode | undefined;
  const gatewayId = Form.useWatch('gatewayTemplate', wizardForm) as string | undefined;
  const enablePreprocess = Form.useWatch('enablePreprocess', wizardForm) as boolean | undefined;
  const enableQuality = Form.useWatch('enableQualityCheck', wizardForm) as boolean | undefined;
  const selectedPreprocessRules = Form.useWatch('preprocessRules', wizardForm) as string[] | undefined;
  const selectedQualityRules = Form.useWatch('qualityRules', wizardForm) as string[] | undefined;
  const selectedEncryptionStrategies = Form.useWatch('encryptionStrategies', wizardForm) as string[] | undefined;
  const selectedContract = contractOptions.find((x) => x.id === contractId);
  const selectedGateway = lowGateways.find((x) => x.id === gatewayId);
  const dataFields = selectedContract ? productFields[selectedContract.dataProduct] || [] : [];
  const gatewayOptions = React.useMemo(() => {
    const allEnabled = [...lowGateways, ...mockGatewayTemplates].filter((x) => x.enabled);
    const matched = selectedContract?.dataType ? allEnabled.filter((x) => x.dataType === selectedContract.dataType) : allEnabled;
    return matched.length > 0 ? matched : allEnabled;
  }, [selectedContract]);

  React.useEffect(() => {
    if (!selectedContract || !selectedEncryptionStrategies?.length) {
      wizardForm.setFieldValue('encryptionBindings', []);
      return;
    }
    const bindings = selectedEncryptionStrategies.map((strategy) => ({ strategy, field: undefined }));
    wizardForm.setFieldValue('encryptionBindings', bindings);
  }, [selectedEncryptionStrategies, selectedContract, wizardForm]);
  React.useEffect(() => {
    if (!selectedPreprocessRules || !enablePreprocess) { wizardForm.setFieldValue('preprocessBindings', []); return; }
    wizardForm.setFieldValue('preprocessBindings', selectedPreprocessRules.map((ruleId) => ({ ruleId, field: undefined })));
  }, [selectedPreprocessRules, enablePreprocess, wizardForm]);
  React.useEffect(() => {
    if (!selectedQualityRules || !enableQuality) { wizardForm.setFieldValue('qualityBindings', []); return; }
    wizardForm.setFieldValue('qualityBindings', selectedQualityRules.map((ruleId) => ({ ruleId, field: undefined })));
  }, [selectedQualityRules, enableQuality, wizardForm]);

  const data = useMemo(() => {
    const v = filterForm.getFieldsValue();
    const id = (v.id || '').trim();
    const status = (v.status || []) as (OrderStatus | '全部')[];
    const mode = v.mode as DeliveryMode | '全部' | undefined;
    const time = v.time as [Dayjs, Dayjs] | undefined;
    return orders.filter((o) => {
      if (id && !o.id.includes(id)) return false;
      if (status.length > 0 && !status.includes('全部') && !status.includes(o.status)) return false;
      if (mode && mode !== '全部' && o.mode !== mode) return false;
      if (time) { const t = dayjs(o.createdAt, 'YYYY-MM-DD HH:mm'); if (t.isBefore(time[0]) || t.isAfter(time[1])) return false; }
      return true;
    });
  }, [orders, filterForm]);

  const onQuery = () => { setTableLoading(true); setTimeout(() => { filterForm.setFieldsValue({ ...filterForm.getFieldsValue() }); setTableLoading(false); }, 350); };
  const onReset = () => { filterForm.resetFields(); onQuery(); };
  const openCreate = () => { setEditing(null); wizardForm.resetFields(); setStep(0); setOpen(true); };
  const onEdit = (row: OrderRow) => { setEditing(row); wizardForm.setFieldsValue({ contractId: row.contractId, orderName: row.name, deliveryMode: row.mode }); setStep(1); setOpen(true); };
  const closeWizard = () => { setOpen(false); setSubmitting(false); setEditing(null); setStep(0); wizardForm.resetFields(); };

  const next = async () => {
    if (step === 0 && !editing) {
      await wizardForm.validateFields(['contractId', 'orderName']);
      if (selectedContract && !wizardForm.getFieldValue('deliveryMode')) wizardForm.setFieldValue('deliveryMode', selectedContract.recommendedMode);
    }
    if (step === 1) {
      await wizardForm.validateFields(['deliveryMode']);
      if (deliveryMode === '低密交付') {
        await wizardForm.validateFields(['gatewayTemplate', 'encryptionStrategies', 'transmissionControlPolicy']);
        if (selectedEncryptionStrategies?.length) await wizardForm.validateFields(['encryptionBindings']);
      }
      if (deliveryMode === '中密交付') {
        await wizardForm.validateFields(['trustedEnvTemplate', 'containerPolicy', 'destroyPolicy']);
        if (enablePreprocess) await wizardForm.validateFields(['preprocessRules', 'preprocessBindings']);
        if (enableQuality) await wizardForm.validateFields(['qualityRules', 'qualityBindings']);
      }
    }
    setStep((s) => Math.min(2, s + 1));
  };
  const prev = () => { if (editing && step === 1) return; setStep((s) => Math.max(0, s - 1)); };

  const submit = async () => {
    const v = await wizardForm.validateFields();
    const contract = contractOptions.find((x) => x.id === v.contractId);
    if (!contract) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const summary = v.deliveryMode === '低密交付'
      ? `策略网关:${selectedGateway?.name || '-'} | 管控:${v.transmissionControlPolicy || '-'}`
      : `中密策略:${v.trustedEnvTemplate}/${v.containerPolicy}/${v.destroyPolicy}`;
    if (editing) {
      setOrders((prevRows) => prevRows.map((o) => (o.id === editing.id ? { ...o, mode: v.deliveryMode, configSummary: summary } : o)));
      message.success('订单更新成功');
    } else {
      setOrders((prevRows) => [{
        id: `OD-${dayjs().format('YYYYMMDD-HHmmss')}`, name: v.orderName, contractId: contract.id, contractName: contract.name, mode: v.deliveryMode, status: '生效',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'), sourceConnector: contract.sourceConnector, sourceType: contract.dataType, dataProduct: contract.dataProduct,
        dataAccessPolicy: contract.accessPolicy, dataUsagePolicy: contract.usagePolicy, targetConnector: contract.targetConnector, configSummary: summary,
      }, ...prevRows]);
      message.success('订单创建成功');
    }
    closeWizard();
  };
  const cancelOrder = (row: OrderRow) => Modal.confirm({ title: '确认失效订单', content: `确定要将订单 ${row.id} 设置为失效吗？`, onOk: () => { setOrders((p) => p.map((o) => (o.id === row.id ? { ...o, status: '失效' } : o))); message.success('订单已失效'); } });

  const encryptionBindingRows = (wizardForm.getFieldValue('encryptionBindings') || []) as Array<{ strategy: string; field?: string }>;
  const preprocessBindingRows = (wizardForm.getFieldValue('preprocessBindings') || []) as Array<{ ruleId: string; field?: string }>;
  const qualityBindingRows = (wizardForm.getFieldValue('qualityBindings') || []) as Array<{ ruleId: string; field?: string }>;

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>交付订单</Title>
      <Card size="small">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-y-2">
          <Form.Item name="id" label="订单编号"><Input placeholder="请输入" /></Form.Item>
          <Form.Item name="status" label="状态"><Select mode="multiple" allowClear style={{ width: 260 }} options={['全部', ...Object.keys(statusColor)].map((s) => ({ label: s, value: s }))} /></Form.Item>
          <Form.Item name="mode" label="交付方式"><Select allowClear style={{ width: 160 }} options={[{ label: '全部', value: '全部' }, { label: '低密交付', value: '低密交付' }, { label: '中密交付', value: '中密交付' }]} /></Form.Item>
          <Form.Item name="time" label="时间范围"><RangePicker showTime /></Form.Item>
          <Form.Item><Space><Button type="primary" onClick={onQuery}>查询</Button><Button onClick={onReset}>重置</Button></Space></Form.Item>
        </Form>
      </Card>

      <Card size="small">
        <div className="mb-3"><Button type="primary" onClick={openCreate}>创建交付订单</Button></div>
        <Table
          rowKey="id" dataSource={data} loading={tableLoading} pagination={{ pageSize: 20 }} locale={{ emptyText: <Empty description="暂无交付订单" /> }}
          rowClassName={() => ''}
          columns={[
            { title: '订单编号', dataIndex: 'id', render: (id: string) => <Button type="link" className="px-0" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(id)}`)}>{id}</Button> },
            { title: '订单名称', dataIndex: 'name', render: (name: string) => <Tooltip title={name}><span>{name}</span></Tooltip> },
            { title: '源连接器', dataIndex: 'sourceConnector' }, { title: '目标连接器', dataIndex: 'targetConnector' },
            { title: '交付方式', dataIndex: 'mode', render: (m: DeliveryMode) => <Tag color={m === '低密交付' ? 'blue' : 'purple'}>{m}</Tag> },
            { title: '状态', dataIndex: 'status', render: (s: OrderStatus) => <Tag color={statusColor[s]}>{s}</Tag> },
            { title: '创建时间', dataIndex: 'createdAt' },
            { title: '操作', render: (_: unknown, row: OrderRow) => <Space><Button type="link" onClick={() => navigate(`/delivery/orders/${encodeURIComponent(row.id)}`)}>详情</Button>{row.status === '草稿' && <Button type="link" onClick={() => onEdit(row)}>编辑</Button>}{row.status === '生效' && <Button type="link" danger onClick={() => cancelOrder(row)}>失效</Button>}</Space> },
          ]}
        />
      </Card>

      <Modal
        width={860} open={open} title={editing ? '编辑交付订单' : '创建交付订单'} onCancel={closeWizard} maskClosable={false}
        footer={<Space><Button onClick={closeWizard} disabled={submitting}>取消</Button>{step > 0 && <Button onClick={prev}>上一步</Button>}{step < 2 ? <Button type="primary" onClick={() => void next()} disabled={step === 0 && !editing && !wizardForm.getFieldValue('contractId')}>下一步</Button> : <Button type="primary" onClick={() => void submit()} loading={submitting}>提交</Button>}</Space>}
      >
        <Steps current={step} className="mb-4" items={[{ title: '选择合约' }, { title: '配置交付参数' }, { title: '确认提交' }]} />
        <Form form={wizardForm} layout="vertical" initialValues={{ enablePreprocess: false, enableQualityCheck: false }}>
          {step === 0 && (
            <>
              <Form.Item name="contractId" label="选择合约" rules={[{ required: true, message: '请选择合约' }]}><Select disabled={!!editing} placeholder="请选择合约" options={contractOptions.map((item) => ({ label: `[${item.id}] ${item.name} (目标连接器: ${item.targetConnector})`, value: item.id }))} /></Form.Item>
              <Form.Item name="orderName" label="订单名称" rules={[{ required: true, message: '请输入订单名称' }, { max: 50, message: '订单名称最多50字符' }]}><Input placeholder="请输入订单名称" disabled={!!editing} maxLength={50} /></Form.Item>
              {selectedContract && <Card size="small" className="bg-gray-50" title="合约与数据信息（只读）"><p><Text strong>源连接器：</Text>{selectedContract.sourceConnector}</p><p><Text strong>目标连接器：</Text>{selectedContract.targetConnector}</p><p><Text strong>数据产品：</Text>{selectedContract.dataProduct}（{selectedContract.dataType}）</p><p><Text strong>数据访问策略：</Text>{selectedContract.accessPolicy}</p><p><Text strong>数据使用策略：</Text>{selectedContract.usagePolicy}</p></Card>}
            </>
          )}

          {step === 1 && (
            <>
              <Form.Item name="deliveryMode" label="交付方式" rules={[{ required: true, message: '请选择交付方式' }]}><Radio.Group options={[{ label: '低密交付', value: '低密交付' }, { label: '中密交付', value: '中密交付' }]} /></Form.Item>

              {deliveryMode === '低密交付' && (
                <Card size="small" title="低密策略装配" className="bg-blue-50">
                  <Form.Item name="gatewayTemplate" label="选择策略网关模板" rules={[{ required: true, message: '请选择策略网关模板' }]}>
                    <Select placeholder="仅展示已启用且匹配当前数据类型的网关" options={gatewayOptions.map((g) => ({ label: g.name, value: g.id }))} />
                  </Form.Item>
                  <Form.Item name="encryptionStrategies" label="加密策略" rules={[{ required: true, message: '请选择加密策略' }]}>
                    <Select
                      mode="multiple"
                      placeholder="请选择加密策略"
                      options={lowEncryptionStrategyOptions.map((item) => ({ label: item, value: item }))}
                    />
                  </Form.Item>
                  {selectedGateway && <Card size="small" className="bg-white" title="网关模板摘要（只读）"><p><Text strong>传输配置：</Text>{selectedGateway.transmission}</p><p><Text strong>加密策略：</Text>{selectedGateway.encryptStrategies.length ? selectedGateway.encryptStrategies.join('、') : '无'}</p><p><Text strong>管控策略：</Text>{selectedGateway.control}</p></Card>}

                  {!!selectedEncryptionStrategies?.length && (
                    <Table
                      className="mt-2"
                      size="small"
                      rowKey="strategy"
                      pagination={false}
                      dataSource={encryptionBindingRows}
                      columns={[
                        { title: '加密策略', dataIndex: 'strategy' },
                        { title: '绑定字段', render: (_, __, idx) => <Form.Item name={['encryptionBindings', idx, 'field']} rules={[{ required: true, message: '请选择字段' }]} style={{ marginBottom: 0 }}><Select placeholder="选择字段" options={dataFields.map((f) => ({ label: f, value: f }))} /></Form.Item> },
                      ]}
                    />
                  )}
                  <Form.Item name="transmissionControlPolicy" label="传输服务管控策略" rules={[{ required: true, message: '请选择传输服务管控策略' }]}>
                    <Select
                      placeholder="请选择传输服务管控策略"
                      options={[
                        ...new Set([selectedGateway?.control, ...lowTransmissionControlOptions].filter(Boolean)),
                      ].map((item) => ({ label: item as string, value: item as string }))}
                    />
                  </Form.Item>
                </Card>
              )}

              {deliveryMode === '中密交付' && (
                <Card size="small" title="中密策略模块装配" className="bg-purple-50">
                  <Form.Item name="trustedEnvTemplate" label="可信环境模板" rules={[{ required: true, message: '请选择可信环境模板' }]}><Select options={trustedEnvTemplates.filter((x) => x.enabled).map((x) => ({ label: x.name, value: x.name }))} /></Form.Item>
                  <Form.Item name="enablePreprocess" label="数据预处理"><Radio.Group options={[{ label: '启用预处理', value: true }, { label: '不启用', value: false }]} /></Form.Item>
                  {enablePreprocess && (
                    <>
                      <Form.Item name="preprocessRules" label="预处理规则" rules={[{ required: true, message: '请选择预处理规则' }]}><Select mode="multiple" options={preprocessRules.filter((x) => x.enabled).map((x) => ({ label: x.name, value: x.id }))} /></Form.Item>
                      <Table
                        size="small" pagination={false} dataSource={preprocessBindingRows} rowKey="ruleId"
                        columns={[
                          { title: '预处理规则', render: (_, row) => preprocessRules.find((x) => x.id === row.ruleId)?.name || row.ruleId },
                          { title: '绑定字段', render: (_, __, idx) => <Form.Item name={['preprocessBindings', idx, 'field']} rules={[{ required: true, message: '选择字段' }]} style={{ marginBottom: 0 }}><Select options={dataFields.map((f) => ({ label: f, value: f }))} /></Form.Item> },
                        ]}
                      />
                    </>
                  )}
                  <Form.Item name="enableQualityCheck" label="质量检查"><Radio.Group options={[{ label: '执行交付前质量稽核', value: true }, { label: '不执行', value: false }]} /></Form.Item>
                  {enableQuality && (
                    <Space style={{ width: '100%' }} direction="vertical">
                      <Form.Item name="qualityRules" label="质量规则" rules={[{ required: true, message: '请选择质量规则' }]}><Select mode="multiple" options={qualityRules.filter((x) => x.enabled).map((x) => ({ label: x.name, value: x.id }))} /></Form.Item>
                      <Table
                        size="small" pagination={false} dataSource={qualityBindingRows} rowKey="ruleId"
                        columns={[
                          { title: '质量规则', render: (_, row) => qualityRules.find((x) => x.id === row.ruleId)?.name || row.ruleId },
                          { title: '绑定字段', render: (_, __, idx) => <Form.Item name={['qualityBindings', idx, 'field']} rules={[{ required: true, message: '选择字段' }]} style={{ marginBottom: 0 }}><Select options={dataFields.map((f) => ({ label: f, value: f }))} /></Form.Item> },
                        ]}
                      />
                    </Space>
                  )}
                  <Form.Item name="containerPolicy" label="容器隔离策略" rules={[{ required: true, message: '请选择容器隔离策略' }]}><Select options={containerRules.filter((x) => x.enabled).map((x) => ({ label: x.name, value: x.name }))} /></Form.Item>
                  <Form.Item name="destroyPolicy" label="数据销毁策略" rules={[{ required: true, message: '请选择数据销毁策略' }]}><Select options={destroyRules.filter((x) => x.enabled).map((x) => ({ label: x.name, value: x.name }))} /></Form.Item>
                </Card>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Card size="small" className="bg-gray-50" title="合约与数据信息">
                <p><Text strong>合约：</Text>{selectedContract?.id} {selectedContract?.name}</p>
                <p><Text strong>源/目标：</Text>{selectedContract?.sourceConnector} → {selectedContract?.targetConnector}</p>
                <p><Text strong>数据产品：</Text>{selectedContract?.dataProduct}（{selectedContract?.dataType}）</p>
              </Card>
              <Card size="small" className="bg-gray-50 mt-3" title="策略装配详情">
                <p><Text strong>交付方式：</Text>{wizardForm.getFieldValue('deliveryMode')}</p>
                {wizardForm.getFieldValue('deliveryMode') === '低密交付' && (
                  <>
                    <p><Text strong>策略网关：</Text>{selectedGateway?.name || '-'}</p>
                    <p><Text strong>加密策略：</Text>{(wizardForm.getFieldValue('encryptionStrategies') || []).join('、') || '-'}</p>
                    <p><Text strong>传输服务管控策略：</Text>{wizardForm.getFieldValue('transmissionControlPolicy') || '-'}</p>
                  </>
                )}
                {wizardForm.getFieldValue('deliveryMode') === '中密交付' && (
                  <>
                    <p><Text strong>可信环境模板：</Text>{wizardForm.getFieldValue('trustedEnvTemplate')}</p>
                    <p><Text strong>容器隔离策略：</Text>{wizardForm.getFieldValue('containerPolicy')}</p>
                    <p><Text strong>数据销毁策略：</Text>{wizardForm.getFieldValue('destroyPolicy')}</p>
                  </>
                )}
                <p className="mt-2"><Text strong>字段与参数绑定关系：</Text></p>
                <ul className="list-disc pl-5">
                  {encryptionBindingRows.map((item) => <li key={item.strategy}>加密策略“{item.strategy}” 绑定字段：{item.field || '-'}</li>)}
                  {preprocessBindingRows.map((item) => <li key={item.ruleId}>预处理规则“{preprocessRules.find((x) => x.id === item.ruleId)?.name || item.ruleId}” 绑定字段：{item.field || '-'}</li>)}
                  {qualityBindingRows.map((item) => <li key={item.ruleId}>质量规则“{qualityRules.find((x) => x.id === item.ruleId)?.name || item.ruleId}” 绑定字段：{item.field || '-'}</li>)}
                </ul>
              </Card>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryOrders;

