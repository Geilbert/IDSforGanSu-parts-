import React, { useState } from 'react';
import { 
  Tabs, Card, Statistic, Row, Col, Typography, 
  Timeline, Button, Descriptions, Space, Tag, Table, 
  Input, Select, Modal, Form, Switch, Divider, Badge,
  Drawer, Checkbox, message, Tooltip, DatePicker
} from 'antd';
import { 
  Activity, Link as LinkIcon, Database, ShieldCheck, 
  Users, Settings, Search, Filter, Plus, 
  PlayCircle, Edit, AlertCircle, CheckCircle2,
  User as UserIcon, FileText, HardDrive, Share2,
  Eye, Key, Shield, Calendar as CalendarIcon, FileText as FileTextIcon,
  Info
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface ContentPublishingTask {
  key: string;
  title: string;
  contentType: '数据产品目录' | '空间信息摘要' | '其他';
  associatedDataProducts?: string[]; // Optional, only for '数据产品目录'
  content: string; // Rich text, using string for now
  plannedPublishTime: string;
  description: string;
  status: '待审核' | '已通过' | '已驳回' | '已撤回';
  lastUpdate: string;
}

const OperationCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceId = searchParams.get('id') || 'public_ds';
  const spaceNameFromUrl = searchParams.get('name');
  
  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [logFilter, setLogFilter] = useState<string | null>(null);

  // Modal & Drawer Visibility States
  const [connectorDetailVisible, setConnectorDetailVisible] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [removeConnectorVisible, setRemoveConnectorVisible] = useState(false);
  const [connectorToRemove, setConnectorToRemove] = useState<string>('');
  
  const [dataPreviewVisible, setDataPreviewVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState('data');
  const [applyUseVisible, setApplyUseVisible] = useState(false);

  const [qualityRuleModalVisible, setQualityRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleDimension, setRuleDimension] = useState<string>('完整性');
  const [ruleExecutingKeys, setRuleExecutingKeys] = useState<string[]>([]);
  const [failureDetailVisible, setFailureDetailVisible] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<any>(null);

  const [logDetailVisible, setLogDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Content Publishing States
  const [contentPublishingTasks, setContentPublishingTasks] = useState<ContentPublishingTask[]>([
    {
      key: 'cp_1',
      title: '用户行为分析报告',
      contentType: '空间信息摘要',
      content: '本报告详细分析了用户在过去一个月的行为模式和偏好...',
      plannedPublishTime: '2024-04-15 10:00:00',
      description: '向运营团队发布的用户行为分析报告',
      status: '已通过',
      lastUpdate: '2024-04-10 11:30:00',
    },
    {
      key: 'cp_2',
      title: '新产品上线数据接口',
      contentType: '数据产品目录',
      associatedDataProducts: ['product_api_v2', 'user_profile_v3'],
      content: '新产品上线所需的数据接口清单及详细说明。',
      plannedPublishTime: '2024-04-20 14:00:00',
      description: '为新产品提供数据支持',
      status: '待审核',
      lastUpdate: '2024-04-09 16:00:00',
    },
    {
      key: 'cp_3',
      title: '季度财务报表解读',
      contentType: '空间信息摘要',
      content: '对最新季度财务报表进行深入解读，分析营收增长点和成本控制情况。',
      plannedPublishTime: '2024-04-25 09:00:00',
      description: '面向管理层的季度财务分析',
      status: '已驳回',
      lastUpdate: '2024-04-08 10:00:00',
    },
  ]);
  const [contentPublishingLoading] = useState(false);
  const [contentPublishingModalVisible, setContentPublishingModalVisible] = useState(false);
  const [contentPublishingModalType, setContentPublishingModalType] = useState<'add' | 'edit'>('add');
  const [editingPublishingTask, setEditingPublishingTask] = useState<ContentPublishingTask | null>(null);
  const [contentPublishingDetailVisible, setContentPublishingDetailVisible] = useState(false);

  const [qualityForm] = Form.useForm();
  const [publishingForm] = Form.useForm();

  // Simulated space data
  const spaceData = {
    id: spaceId,
    name: spaceNameFromUrl || (spaceId === 'public_ds' ? '公共数据集空间' : (spaceId === 'finance_research' ? '金融研究空间' : '营销运营中心')),
    type: spaceId === 'finance_research' ? '私有空间' : '协作空间',
    status: '正常',
    description: '提供公司内部通用的公共数据集，包括基础字典、组织架构、公共流水等核心业务数据。'
  };

  // 2.2.1 Overview Handlers
  const handleFeedClick = (record: any) => {
    setLogFilter(record.type || 'access');
    setActiveTab('members');
    message.info(`已为您筛选相关日志：${record.type || '访问资源'}`);
  };

  // 2.2.2 Connector Handlers
  const handleAddConnector = () => {
    navigate(`/resource/access?spaceId=${spaceId}`);
  };

  const showConnectorDetail = (record: any) => {
    setSelectedConnector(record);
    setConnectorDetailVisible(true);
  };

  const showRemoveConnector = (name: string) => {
    setConnectorToRemove(name);
    setRemoveConnectorVisible(true);
  };

  const handleRemoveConnector = () => {
    message.loading('正在移除连接器...', 1.5).then(() => {
      message.success(`连接器 "${connectorToRemove}" 已成功从空间移除`);
      setRemoveConnectorVisible(false);
    });
  };

  // 2.2.3 Data Product Handlers
  const showDataPreview = (record: any) => {
    setSelectedResource(record);
    setDataPreviewVisible(true);
  };

  const showApplyUse = () => {
    setApplyUseVisible(true);
  };

  const handleConfirmApply = () => {
    message.loading('正在处理授权...', 1).then(() => {
      message.success('申请已通过！您现在可以访问该数据产品。');
      setApplyUseVisible(false);
    });
  };

  // 2.2.4 Quality Handlers
  const handleAddRule = () => {
    setEditingRule(null);
    setQualityRuleModalVisible(true);
    qualityForm.resetFields();
  };

  const handleEditRule = (record: any) => {
    setEditingRule(record);
    setQualityRuleModalVisible(true);
    qualityForm.setFieldsValue(record);
    setRuleDimension(record.dim);
  };

  const executeRule = (key: string) => {
    setRuleExecutingKeys([...ruleExecutingKeys, key]);
    setTimeout(() => {
      setRuleExecutingKeys(prev => prev.filter(k => k !== key));
      message.success('检查执行完成！结果：通过');
    }, 2000);
  };

  const showFailureDetail = (record: any) => {
    setSelectedFailure(record);
    setFailureDetailVisible(true);
  };

  // 2.2.5 Members & Logs Handlers
  const showRemoveMember = (account: string) => {
    confirm({
      title: '确认移除成员',
      icon: <AlertCircle className="text-red-500" />,
      content: `确定要将成员 "${account}" 从本空间移除吗？该用户将失去对空间内所有资源的访问权限。`,
      okText: '确认移除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        message.success('成员已成功移除');
      },
    });
  };

  const showLogDetail = (record: any) => {
    setSelectedLog(record);
    setLogDetailVisible(true);
  };

  // 2.2.7 Content Publishing Handlers
  const handleAddPublishingTask = () => {
    setContentPublishingModalType('add');
    setEditingPublishingTask(null);
    publishingForm.resetFields();
    setContentPublishingModalVisible(true);
  };

  const handleEditPublishingTask = (record: ContentPublishingTask) => {
    setContentPublishingModalType('edit');
    setEditingPublishingTask(record);
    publishingForm.setFieldsValue(record);
    setContentPublishingModalVisible(true);
  };

  const showContentPublishingDetail = (record: ContentPublishingTask) => {
    setEditingPublishingTask(record);
    setContentPublishingDetailVisible(true);
  };

  const handlePublishingModalSubmit = () => {
    publishingForm.validateFields().then(values => {
      message.loading('正在保存...', 1).then(() => {
        message.success(contentPublishingModalType === 'add' ? '发布任务创建成功' : '发布任务已更新');
        
        if (contentPublishingModalType === 'add') {
          const newItem: ContentPublishingTask = {
            ...values,
            key: `cp_${Date.now()}`,
            status: '待审核',
            lastUpdate: new Date().toLocaleString(),
          };
          setContentPublishingTasks(prev => [newItem, ...prev]);
        } else {
          setContentPublishingTasks(prev => prev.map(item => 
            item.key === editingPublishingTask?.key ? { ...item, ...values, lastUpdate: new Date().toLocaleString() } : item
          ));
        }
        setContentPublishingModalVisible(false);
      });
    });
  };

  const handleContentPublishingStatusChange = (record: ContentPublishingTask, newStatus: '已通过' | '已驳回' | '已撤回') => {
    let title = '';
    let content = '';
    let okText = '';
    let okType: 'danger' | 'primary' = 'primary';

    if (newStatus === '已通过') {
      title = '确认通过';
      content = `确定要通过发布任务“${record.title}”吗？通过后将正式发布。`;
      okText = '确认通过';
    } else if (newStatus === '已驳回') {
      title = '确认驳回';
      content = `确定要驳回发布任务“${record.title}”吗？驳回后任务将回到草稿状态。`;
      okText = '确认驳回';
      okType = 'danger';
    } else if (newStatus === '已撤回') {
      title = '确认撤回';
      content = `确定要撤回发布任务“${record.title}”吗？撤回后任务将不再可见。`;
      okText = '确认撤回';
      okType = 'danger';
    }

    Modal.confirm({
      title: title,
      icon: <AlertCircle className={okType === 'danger' ? "text-red-500" : "text-blue-500"} />,
      content: content,
      okText: okText,
      okType: okType,
      cancelText: '取消',
      onOk: () => {
        message.loading(`正在${okText.replace('确认', '')}...`, 0.5).then(() => {
          setContentPublishingTasks(prev => prev.map(item => 
            item.key === record.key ? { ...item, status: newStatus, lastUpdate: new Date().toLocaleString() } : item
          ));
          message.success(`${okText.replace('确认', '')}成功`);
        });
      }
    });
  };

  // 2.2.6 Settings Handlers
  const handleSaveSettings = () => {
    message.loading('正在保存修改...', 1).then(() => {
      message.success({
        content: '保存成功',
        duration: 3,
        style: { marginTop: '10vh' },
      });
    });
  };

  const tabItems = [
    {
      key: 'overview',
      label: <span className="flex items-center gap-2"><Activity size={16} /> 概览</span>,
      children: (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            {[
              { title: '连接器总数', value: 12, trend: '+2', icon: <LinkIcon className="text-blue-500" /> },
              { title: '在线连接器', value: 10, suffix: '/ 12', icon: <CheckCircle2 className="text-green-500" /> },
              { title: '数据产品总数', value: 45, trend: '+5', icon: <Database className="text-purple-500" /> },
              { title: '今日 API 调用', value: '1.2k', trend: '+12%', icon: <Activity className="text-orange-500" /> },
              { title: '活跃成员数', value: 8, icon: <Users className="text-cyan-500" /> },
            ].map((stat, idx) => (
              <Col key={idx} flex="1">
                <Card bordered={false} className="shadow-sm">
                  <Statistic 
                    title={<span className="text-gray-500 text-sm">{stat.title}</span>}
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={<span className="mr-2">{stat.icon}</span>}
                    valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                  />
                  {stat.trend && (
                    <div className="mt-1 text-xs text-green-500">
                      较上周 {stat.trend}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
          
          <Card title="最近活动Feed" className="shadow-sm">
            <Timeline
              items={[
                { children: <div className="text-sm cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleFeedClick({type: '访问资源'})}><Text strong>系统管理员</Text> 于 10:25 访问了资源 <Text className="text-blue-500">User_Transaction_Records</Text></div> },
                { children: <div className="text-sm cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleFeedClick({type: '变更配置'})}><Text strong>张三</Text> 于 09:40 更新了连接器 <Text className="text-blue-500">MySQL_ERP_01</Text> 的配置</div> },
                { children: <div className="text-sm cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleFeedClick({type: '任务执行'})}><Text strong>任务调度系统</Text> 于 08:00 执行任务 <Text className="text-blue-500">Daily_Data_Sync</Text> 成功</div>, color: 'green' },
                { children: <div className="text-sm cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleFeedClick({type: '成员变更'})}><Text strong>李四</Text> 于 昨天 17:30 申请加入空间</div> },
                { children: <div className="text-sm cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleFeedClick({type: '质量告警'})}><Text strong>数据质量系统</Text> 于 昨天 16:00 报告 <Text className="text-red-500">1项数据质量告警</Text></div>, color: 'red' },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'connectors',
      label: <span className="flex items-center gap-2"><LinkIcon size={16} /> 连接器</span>,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={handleAddConnector}>添加连接器</Button>
          </div>
          <Table 
            dataSource={[
              { key: '1', name: 'MySQL_Finance', type: 'Database', status: 'online', resources: 124, open: 85, time: '2024-03-01', host: '10.24.1.5', port: '3306', db: 'finance_db' },
              { key: '2', name: 'Oracle_HR', type: 'Database', status: 'online', resources: 56, open: 20, time: '2024-03-15', host: '10.24.1.8', port: '1521', db: 'hr_prod' },
              { key: '3', name: 'ERP_API_Gateway', type: 'API', status: 'offline', resources: 12, open: 5, time: '2024-04-01', host: 'api.internal.erp.com', port: '443', db: '-' },
            ]}
            columns={[
              { title: '连接器名称', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
              { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag>{type}</Tag> },
              { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Badge status={s === 'online' ? 'success' : 'error'} text={s === 'online' ? '在线' : '离线'} /> },
              { title: '资源总数', dataIndex: 'resources', key: 'resources' },
              { title: '开放资源数', dataIndex: 'open', key: 'open' },
              { title: '加入时间', dataIndex: 'time', key: 'time' },
              { title: '操作', key: 'action', render: (_, record) => (
                <Space size="middle">
                  <Button type="link" size="small" onClick={() => showConnectorDetail(record)}>详情</Button>
                  <Button type="link" danger size="small" onClick={() => showRemoveConnector(record.name)}>移除</Button>
                </Space>
              )},
            ]}
            pagination={false}
            className="shadow-sm rounded-lg overflow-hidden"
          />
        </div>
      ),
    },
    {
      key: 'products',
      label: <span className="flex items-center gap-2"><Database size={16} /> 数据产品</span>,
      children: (
        <div className="space-y-4">
          <Row gutter={16}>
            <Col span={8}>
              <Input placeholder="按名称搜索数据产品" prefix={<Search size={16} className="text-gray-400" />} />
            </Col>
            <Col span={6}>
              <Select placeholder="资源类型" className="w-full">
                <Select.Option value="table">数据表</Select.Option>
                <Select.Option value="api">API 接口</Select.Option>
                <Select.Option value="file">文件集</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select placeholder="数据分类" className="w-full">
                <Select.Option value="finance">财务数据</Select.Option>
                <Select.Option value="user">用户行为</Select.Option>
                <Select.Option value="operation">运营指标</Select.Option>
              </Select>
            </Col>
          </Row>
          <Table 
            dataSource={[
              { key: '1', name: 'User_Transaction_Logs', type: 'Table', connector: 'MySQL_Finance', category: '财务', level: 'L3', updated: '2024-04-07 10:00' },
              { key: '2', name: 'Daily_Active_Users_API', type: 'API', connector: 'ERP_API', category: '运营', level: 'L2', updated: '2024-04-07 09:30' },
              { key: '3', name: 'Product_Catalog_2024', type: 'File', connector: 'S3_Storage', category: '商品', level: 'L1', updated: '2024-04-06' },
            ]}
            columns={[
              { title: '产品名称', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
              { title: '资源类型', dataIndex: 'type', key: 'type' },
              { title: '来源连接器', dataIndex: 'connector', key: 'connector' },
              { title: '数据分类', dataIndex: 'category', key: 'category' },
              { title: '数据分级', dataIndex: 'level', key: 'level', render: (l) => <Tag color={l === 'L3' ? 'red' : (l === 'L2' ? 'orange' : 'blue')}>{l}</Tag> },
              { title: '最近更新', dataIndex: 'updated', key: 'updated' },
              { title: '操作', key: 'action', render: (_, record) => (
                <Space size="middle">
                  <Button type="primary" size="small" onClick={showApplyUse}>申请使用</Button>
                  <Button size="small" icon={<Eye size={14} />} onClick={() => showDataPreview(record)}>预览</Button>
                </Space>
              )},
            ]}
          />
        </div>
      ),
    },
    {
      key: 'quality',
      label: <span className="flex items-center gap-2"><ShieldCheck size={16} /> 质量监控</span>,
      children: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Title level={5} style={{ margin: 0 }}>质量校验规则</Title>
            <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={handleAddRule}>新增规则</Button>
          </div>
          <Table 
            dataSource={[
              { key: '1', name: '非空约束校验', dim: '完整性', trigger: ['手动触发', '实时校验'], result: 'success', time: '2024-04-07 08:00', resources: ['User_Transaction_Logs'] },
              { key: '2', name: '金额范围校验', dim: '准确性', trigger: ['手动触发'], result: 'error', time: '2024-04-07 09:15', resources: ['Order_Master'] },
              { key: '3', name: '主键唯一性校验', dim: '唯一性', trigger: ['定时触发'], result: 'success', time: '2024-04-06', resources: ['Product_Catalog'] },
            ]}
            columns={[
              { title: '规则名称', dataIndex: 'name', key: 'name' },
              { title: '校验维度', dataIndex: 'dim', key: 'dim' },
              { title: '触发方式', dataIndex: 'trigger', key: 'trigger', render: (t: string[]) => t.map(tag => <Tag key={tag}>{tag}</Tag>) },
              { title: '最近检查结果', dataIndex: 'result', key: 'result', render: (r) => <Badge status={r === 'success' ? 'success' : 'error'} text={r === 'success' ? '通过' : '失败'} /> },
              { title: '上次检查时间', dataIndex: 'time', key: 'time' },
              { title: '操作', key: 'action', render: (_, record) => (
                <Space size="small">
                  {record.trigger.includes('手动触发') && (
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<PlayCircle size={14} />}
                      loading={ruleExecutingKeys.includes(record.key)}
                      onClick={() => executeRule(record.key)}
                    >
                      {ruleExecutingKeys.includes(record.key) ? '检查中...' : '立即执行'}
                    </Button>
                  )}
                  <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEditRule(record)}>编辑</Button>
                  <Button type="link" danger size="small">停用</Button>
                </Space>
              )},
            ]}
            pagination={false}
          />
          
          <Divider />
          
          <div className="space-y-4">
            <Title level={5}>质量报告 (检查失败记录)</Title>
            <Table 
              dataSource={[
                { key: '1', rule: '金额范围校验', target: 'order_table.amount', detail: '发现 12 条记录金额小于 0', time: '2024-04-07 09:15', failedRows: [{id: 1024, val: -5}, {id: 1056, val: -12.5}] },
              ]}
              columns={[
                { title: '规则名称', dataIndex: 'rule', key: 'rule' },
                { title: '检查对象', dataIndex: 'target', key: 'target' },
                { title: '失败详情', dataIndex: 'detail', key: 'detail', render: (t) => <Text type="danger" className="cursor-pointer hover:underline" onClick={() => showFailureDetail({rule: '金额范围校验', detail: t})}>{t}</Text> },
                { title: '记录时间', dataIndex: 'time', key: 'time' },
              ]}
              pagination={false}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'members',
      label: <span className="flex items-center gap-2"><Users size={16} /> 成员与日志</span>,
      children: (
        <div className="space-y-8">
          <div>
            <Title level={5} className="mb-4 flex items-center gap-2"><UserIcon size={18} className="text-blue-500" /> 成员管理</Title>
            <Table 
              dataSource={[
                { key: '1', account: 'admin@system.com', role: '空间管理员', joinTime: '2024-01-01', lastActive: '10 分钟前' },
                { key: '2', account: 'zhangsan@corp.com', role: '开发者', joinTime: '2024-03-15', lastActive: '2 小时前' },
                { key: '3', account: 'lisi@corp.com', role: '查看者', joinTime: '2024-04-01', lastActive: '1 天前' },
              ]}
              columns={[
                { title: '成员账号', dataIndex: 'account', key: 'account' },
                { title: '角色', dataIndex: 'role', key: 'role', render: (r) => <Tag color={r === '空间管理员' ? 'gold' : 'blue'}>{r}</Tag> },
                { title: '加入时间', dataIndex: 'joinTime', key: 'joinTime' },
                { title: '最后活跃', dataIndex: 'lastActive', key: 'lastActive' },
                { title: '操作', key: 'action', render: (_, record) => <Button type="link" danger size="small" onClick={() => showRemoveMember(record.account)}>移除</Button> },
              ]}
              pagination={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Title level={5} className="m-0 flex items-center gap-2"><FileText size={18} className="text-orange-500" /> 空间活动日志</Title>
              <Space>
                <Select value={logFilter || 'all'} style={{ width: 120 }} onChange={(v) => setLogFilter(v === 'all' ? null : v)}>
                  <Select.Option value="all">所有操作</Select.Option>
                  <Select.Option value="access">访问资源</Select.Option>
                  <Select.Option value="config">变更配置</Select.Option>
                  <Select.Option value="task">任务执行</Select.Option>
                </Select>
                <Button icon={<Filter size={14} />}>筛选时间</Button>
              </Space>
            </div>
            <Table 
              dataSource={[
                { key: '1', time: '2024-04-07 10:25', user: 'admin', type: '访问资源', obj: 'User_Transaction_Records', detail: '预览了前 100 条数据', req: '{ action: "preview", limit: 100 }', res: '{ status: "success", data: [...] }' },
                { key: '2', time: '2024-04-07 09:40', user: 'zhangsan', type: '变更配置', obj: 'MySQL_Finance', detail: '更新了连接密码', req: '{ action: "update_config", fields: ["password"] }', res: '{ status: "success" }' },
                { key: '3', time: '2024-04-07 08:00', user: 'System', type: '任务执行', obj: 'Daily_Sync', detail: '任务成功完成', req: '{ jobId: "daily_sync_001" }', res: '{ result: "success", count: 1284000 }' },
              ].filter(l => !logFilter || l.type === logFilter)}
              columns={[
                { title: '时间', dataIndex: 'time', key: 'time' },
                { title: '操作者', dataIndex: 'user', key: 'user' },
                { title: '操作类型', dataIndex: 'type', key: 'type' },
                { title: '操作对象', dataIndex: 'obj', key: 'obj' },
                { title: '详情', dataIndex: 'detail', key: 'detail' },
              ]}
              onRow={(record) => ({
                onClick: () => showLogDetail(record),
                className: 'cursor-pointer hover:bg-gray-50'
              })}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'publishing',
      label: <span className="flex items-center gap-2"><FileTextIcon size={16} /> 内容发布</span>,
      children: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Title level={5} style={{ margin: 0 }}>内容发布管理</Title>
              <Input 
                placeholder="搜索发布标题或内容类型" 
                prefix={<Search size={16} className="text-gray-400" />} 
                className="w-64"
              />
            </div>
            <Button 
              type="primary" 
              icon={<Plus size={16} />} 
              className="flex items-center gap-1"
              onClick={handleAddPublishingTask}
            >
              创建发布任务
            </Button>
          </div>
          <Table 
            dataSource={[...contentPublishingTasks].sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())}
            loading={contentPublishingLoading}
            columns={[
              { 
                title: '发布标题', 
                dataIndex: 'title', 
                key: 'title',
                render: (text: string, record: ContentPublishingTask) => (
                  <Button type="link" className="p-0 h-auto font-medium" onClick={() => showContentPublishingDetail(record)}>{text}</Button>
                )
              },
              { 
                title: '内容类型', 
                dataIndex: 'contentType', 
                key: 'contentType',
                render: (type: ContentPublishingTask['contentType']) => {
                  let color = 'blue';
                  if (type === '数据产品目录') color = 'purple';
                  if (type === '空间信息摘要') color = 'green';
                  return <Tag color={color}>{type}</Tag>;
                }
              },
              { 
                title: '状态', 
                dataIndex: 'status', 
                key: 'status',
                render: (status: ContentPublishingTask['status']) => {
                  let statusColor: 'default' | 'success' | 'error' | 'warning' | 'processing' = 'default';
                  if (status === '已通过') statusColor = 'success';
                  if (status === '待审核') statusColor = 'processing';
                  if (status === '已驳回') statusColor = 'error';
                  if (status === '已撤回') statusColor = 'warning';
                  return <Badge status={statusColor} text={status} />;
                }
              },
              { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate' },
              {
                title: '操作', key: 'action', width: 220,
                render: (_: any, record: ContentPublishingTask) => (
                  <Space size="middle">
                    {(record.status === '待审核' || record.status === '已驳回') && (
                      <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEditPublishingTask(record)}>
                        编辑
                      </Button>
                    )}
                    <Button type="link" size="small" icon={<Info size={14} />} onClick={() => showContentPublishingDetail(record)}>详情</Button>
                    {record.status === '待审核' && (
                      <>
                        <Button type="link" size="small" onClick={() => handleContentPublishingStatusChange(record, '已通过')}>通过</Button>
                        <Button type="link" size="small" danger onClick={() => handleContentPublishingStatusChange(record, '已驳回')}>驳回</Button>
                      </>
                    )}
                    {(record.status === '已通过' || record.status === '已驳回') && (
                      <Button type="link" size="small" danger onClick={() => handleContentPublishingStatusChange(record, '已撤回')}>撤回</Button>
                    )}
                  </Space>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
            className="config-table"
          />
        </div>
      ),
    },
    {
      key: 'settings',
      label: <span className="flex items-center gap-2"><Settings size={16} /> 设置</span>,
      children: (
        <Card className="shadow-sm max-w-4xl">
          <Form layout="vertical" initialValues={{ name: spaceData.name, desc: spaceData.description, backup: true, interval: 'daily' }}>
            <Title level={5} className="mb-4">区块 1: 基础信息</Title>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="空间名称" name="name">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="空间图标">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                      <HardDrive size={24} />
                    </div>
                    <Button size="small">更换图标</Button>
                  </div>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="空间描述" name="desc">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Divider />

            <Title level={5} className="mb-4">区块 2: 数据使用策略</Title>
            <Form.Item name="policy" label="策略说明">
              <Input.TextArea rows={4} placeholder="在此填写本空间的数据使用合规说明、审批流程等策略详情..." />
            </Form.Item>

            <Divider />

            <Title level={5} className="mb-4">区块 3: 备份配置</Title>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Form.Item label="是否启用自动备份" name="backup" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="备份周期" name="interval">
                <Select style={{ width: 200 }}>
                  <Select.Option value="hourly">每小时</Select.Option>
                  <Select.Option value="daily">每天</Select.Option>
                  <Select.Option value="weekly">每周</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div className="mt-8">
              <Button type="primary" size="large" className="px-8" onClick={handleSaveSettings}>保存修改</Button>
            </div>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Space Header Info */}
      <Card className="shadow-sm border-none bg-gradient-to-r from-white to-blue-50">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Title level={3} style={{ margin: 0 }}>{spaceData.name} 运营中心</Title>
              <Tag color="blue">{spaceData.type}</Tag>
              <Badge status="success" text="状态正常" />
            </div>
            <Paragraph type="secondary" style={{ margin: 0, maxWidth: '800px' }}>
              {spaceData.description}
            </Paragraph>
          </div>
          <Button icon={<Share2 size={16} />} className="flex items-center gap-1">分享空间</Button>
        </div>
      </Card>
      
      {/* Main Tabs */}
      <Card className="shadow-sm border-none overflow-hidden">
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems} 
          size="large"
          tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
          className="operation-tabs"
        />
      </Card>

      {/* MODALS & DRAWERS */}

      {/* 2.2.2 Connector Details Drawer */}
      <Drawer
        title={<div className="flex items-center gap-2"><Key size={18} className="text-blue-500" /> 连接器详情 - {selectedConnector?.name}</div>}
        open={connectorDetailVisible}
        onClose={() => setConnectorDetailVisible(false)}
        width={500}
      >
        {selectedConnector && (
          <div className="space-y-6">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="名称">{selectedConnector.name}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag>{selectedConnector.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={selectedConnector.status === 'online' ? 'success' : 'error'} text={selectedConnector.status === 'online' ? '在线' : '离线'} /></Descriptions.Item>
              <Descriptions.Item label="主机地址">{selectedConnector.host}</Descriptions.Item>
              <Descriptions.Item label="端口">{selectedConnector.port}</Descriptions.Item>
              <Descriptions.Item label="数据库/源">{selectedConnector.db}</Descriptions.Item>
              <Descriptions.Item label="资源总数">{selectedConnector.resources}</Descriptions.Item>
              <Descriptions.Item label="最后同步时间">{selectedConnector.time}</Descriptions.Item>
            </Descriptions>
            
            <Card title="状态监控 (近24小时成功率)" size="small" className="bg-gray-50">
              <div className="flex items-end gap-1 h-20">
                {[80, 100, 100, 95, 100, 100, 40, 100, 100, 100, 98, 100].map((val, i) => (
                  <Tooltip key={i} title={`成功率: ${val}%`}>
                    <div 
                      className={`flex-1 rounded-t-sm transition-all hover:opacity-80 ${val < 50 ? 'bg-red-400' : (val < 90 ? 'bg-orange-400' : 'bg-green-400')}`} 
                      style={{ height: `${val}%` }} 
                    />
                  </Tooltip>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>24h 前</span>
                <span>现在</span>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 2.2.2 Remove Connector Modal */}
      <Modal
        title={<div className="flex items-center gap-2"><AlertCircle className="text-red-500" size={20} /> 移除连接器</div>}
        open={removeConnectorVisible}
        onCancel={() => setRemoveConnectorVisible(false)}
        onOk={handleRemoveConnector}
        okText="确认移除"
        okType="danger"
        cancelText="取消"
      >
        <div className="space-y-4 py-2">
          <Paragraph>
            确定要将连接器 <Text strong>"{connectorToRemove}"</Text> 从当前空间中移除吗？
          </Paragraph>
          <div className="bg-orange-50 p-3 rounded-md border border-orange-100 text-orange-700 text-xs">
            注意：此操作不会从物理数据源删除数据，但会立即中断与该连接器相关的所有自动化数据同步任务。
          </div>
          <Form layout="vertical">
            <Form.Item label="移除原因 (可选)">
              <Input.TextArea placeholder="请输入移除原因，将记录在空间日志中..." />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 2.2.3 Data Preview Modal */}
      <Modal
        title={`数据预览 - ${selectedResource?.name}`}
        open={dataPreviewVisible}
        onCancel={() => setDataPreviewVisible(false)}
        footer={[<Button key="close" onClick={() => setDataPreviewVisible(false)}>关闭</Button>]}
        width={900}
      >
        <Tabs 
          activeKey={previewTab} 
          onChange={setPreviewTab}
          items={[
            {
              key: 'data',
              label: '样例数据',
              children: (
                <Table 
                  size="small"
                  dataSource={[
                    { id: 1, user: 'User_001', amount: 128.5, time: '2024-04-07 10:00', status: 'PAID' },
                    { id: 2, user: 'User_045', amount: 56.0, time: '2024-04-07 10:05', status: 'PENDING' },
                    { id: 3, user: 'User_012', amount: 999.9, time: '2024-04-07 10:12', status: 'PAID' },
                  ]}
                  columns={[
                    { title: 'ID', dataIndex: 'id' },
                    { title: '用户', dataIndex: 'user' },
                    { title: '金额', dataIndex: 'amount' },
                    { title: '时间', dataIndex: 'time' },
                    { title: '状态', dataIndex: 'status' },
                  ]}
                  pagination={false}
                />
              )
            },
            {
              key: 'meta',
              label: '元数据',
              children: (
                <Table 
                  size="small"
                  dataSource={[
                    { field: 'id', type: 'BIGINT', desc: '主键ID' },
                    { field: 'user', type: 'VARCHAR(64)', desc: '用户唯一标识' },
                    { field: 'amount', type: 'DECIMAL(18,2)', desc: '交易金额' },
                    { field: 'time', type: 'DATETIME', desc: '交易发生时间' },
                    { field: 'status', type: 'ENUM', desc: '交易状态' },
                  ]}
                  columns={[
                    { title: '字段名', dataIndex: 'field', render: (t) => <code className="text-blue-600">{t}</code> },
                    { title: '类型', dataIndex: 'type' },
                    { title: '描述', dataIndex: 'desc' },
                  ]}
                  pagination={false}
                />
              )
            }
          ]}
        />
      </Modal>

      {/* 2.2.3 Apply for Use Modal */}
      <Modal
        title="申请使用"
        open={applyUseVisible}
        onCancel={() => setApplyUseVisible(false)}
        onOk={handleConfirmApply}
        okText="确认申请"
        cancelText="取消"
      >
        <div className="py-4 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
            <Shield size={32} />
          </div>
          <div>
            <Title level={5}>管理员直接授权</Title>
            <Paragraph type="secondary">
              您当前以 <Text strong>空间管理员</Text> 身份操作。系统将自动通过此申请并直接为您授予该数据产品的访问权限。
            </Paragraph>
          </div>
        </div>
      </Modal>

      {/* 2.2.4 Quality Rule Modal */}
      <Modal
        title={editingRule ? '编辑数据质量规则' : '新增数据质量规则'}
        open={qualityRuleModalVisible}
        onCancel={() => setQualityRuleModalVisible(false)}
        onOk={() => {
          message.success(editingRule ? '规则已更新' : '规则已保存');
          setQualityRuleModalVisible(false);
        }}
        width={600}
      >
        <Form form={qualityForm} layout="vertical" className="mt-4">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="输入规则名称" />
          </Form.Item>
          <Form.Item name="resources" label="适用数据资源" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择开放状态的资源">
              <Select.Option value="User_Transaction_Logs">User_Transaction_Logs</Select.Option>
              <Select.Option value="Order_Master">Order_Master</Select.Option>
              <Select.Option value="Product_Catalog">Product_Catalog</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dim" label="校验维度" rules={[{ required: true }]}>
            <Select onChange={setRuleDimension} defaultValue="完整性">
              <Select.Option value="完整性">完整性</Select.Option>
              <Select.Option value="准确性">准确性</Select.Option>
              <Select.Option value="唯一性">唯一性</Select.Option>
              <Select.Option value="一致性">一致性</Select.Option>
            </Select>
          </Form.Item>
          
          <Card size="small" title="规则配置" className="bg-gray-50 mb-4">
            {ruleDimension === '完整性' && (
              <div className="flex items-center gap-4">
                <span>字段:</span>
                <Select placeholder="选择字段" className="w-32"><Select.Option value="user">user</Select.Option></Select>
                <span>阈值: &gt;=</span>
                <Input suffix="%" className="w-20" defaultValue="99" />
              </div>
            )}
            {ruleDimension !== '完整性' && (
              <Text type="secondary">请根据选定维度配置详细逻辑参数...</Text>
            )}
          </Card>

          <Form.Item name="trigger" label="触发方式" rules={[{ required: true }]}>
            <Checkbox.Group>
              <Checkbox value="实时校验">实时校验</Checkbox>
              <Checkbox value="手动触发">手动触发</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="email" label="告警邮箱">
            <Input placeholder="alerts@company.com" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2.2.4 Failure Detail Modal */}
      <Modal
        title="质量检查异常详情"
        open={failureDetailVisible}
        onCancel={() => setFailureDetailVisible(false)}
        footer={null}
        width={700}
      >
        <div className="space-y-4">
          <Badge status="error" text={<Text strong>规则: {selectedFailure?.rule}</Text>} />
          <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
            异常摘要: {selectedFailure?.detail}
          </div>
          <Table 
            size="small"
            title={() => <Text strong>违规样本记录 (Top 5)</Text>}
            dataSource={[
              { id: 1024, field: 'amount', val: -5, reason: '小于最小值 0' },
              { id: 1056, field: 'amount', val: -12.5, reason: '小于最小值 0' },
            ]}
            columns={[
              { title: '主键 ID', dataIndex: 'id' },
              { title: '异常字段', dataIndex: 'field' },
              { title: '当前值', dataIndex: 'val', render: (v) => <Text type="danger">{v}</Text> },
              { title: '违反原因', dataIndex: 'reason' },
            ]}
            pagination={false}
          />
        </div>
      </Modal>

      {/* 2.2.5 Log Detail Modal */}
      <Modal
        title="日志操作详情"
        open={logDetailVisible}
        onCancel={() => setLogDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedLog && (
          <div className="space-y-4">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="操作时间">{selectedLog.time}</Descriptions.Item>
              <Descriptions.Item label="操作人">{selectedLog.user}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{selectedLog.type}</Descriptions.Item>
              <Descriptions.Item label="操作对象">{selectedLog.obj}</Descriptions.Item>
            </Descriptions>
            <Divider className="my-2" />
            <div>
              <Text strong className="block mb-2">Request Payload:</Text>
              <pre className="bg-black text-gray-300 p-3 rounded-md text-xs">{selectedLog.req}</pre>
            </div>
            <div>
              <Text strong className="block mb-2">Response Data:</Text>
              <pre className="bg-black text-green-400 p-3 rounded-md text-xs">{selectedLog.res}</pre>
            </div>
          </div>
        )}
      </Modal>

      {/* 2.2.7 Content Publishing Modal */}
      <Modal
        title={contentPublishingModalType === 'add' ? '创建发布任务' : '编辑发布任务'}
        open={contentPublishingModalVisible}
        onCancel={() => setContentPublishingModalVisible(false)}
        onOk={handlePublishingModalSubmit}
        width={600}
        destroyOnClose
      >
        <Form form={publishingForm} layout="vertical" className="mt-4">
          <Form.Item name="title" label="发布标题" rules={[{ required: true, message: '请输入发布标题' }]}>
            <Input placeholder="请输入发布标题" />
          </Form.Item>
          <Form.Item name="contentType" label="内容类型" rules={[{ required: true, message: '请选择内容类型' }]}>
            <Select placeholder="请选择内容类型">
              <Select.Option value="数据产品目录">数据产品目录</Select.Option>
              <Select.Option value="空间信息摘要">空间信息摘要</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.contentType !== currentValues.contentType}
          >
            {({ getFieldValue }) =>
              getFieldValue('contentType') === '数据产品目录' ? (
                <Form.Item name="associatedDataProducts" label="关联数据产品">
                  <Select mode="multiple" placeholder="选择关联数据产品（可选本空间已开放资源）">
                    <Select.Option value="product_api_v2">产品API V2</Select.Option>
                    <Select.Option value="user_profile_v3">用户画像 V3</Select.Option>
                    <Select.Option value="sales_report_2023">2023销售报告</Select.Option>
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="content" label="发布内容">
            <Input.TextArea rows={6} placeholder="请输入发布内容（富文本编辑器待集成）" />
          </Form.Item>
          <Form.Item name="plannedPublishTime" label="计划发布时间" rules={[{ required: true, message: '请选择计划发布时间' }]}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="发布说明">
            <Input.TextArea rows={3} placeholder="请输入发布说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2.2.7 Content Publishing Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileTextIcon size={20} className="text-blue-500" />
            <span>内容发布任务详情: {editingPublishingTask?.title}</span>
          </div>
        }
        placement="right"
        width={500}
        onClose={() => setContentPublishingDetailVisible(false)}
        open={contentPublishingDetailVisible}
        destroyOnClose
        extra={
          <Button onClick={() => setContentPublishingDetailVisible(false)}>关闭</Button>
        }
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setContentPublishingDetailVisible(false)}>关闭</Button>
          </div>
        }
      >
        {contentPublishingDetailVisible && editingPublishingTask && (
          <div className="space-y-6">
            <Descriptions title="基本信息" column={1} bordered size="small">
              <Descriptions.Item label="发布标题">{editingPublishingTask.title}</Descriptions.Item>
              <Descriptions.Item label="内容类型">
                <Tag color="blue">{editingPublishingTask.contentType}</Tag>
              </Descriptions.Item>
              {editingPublishingTask.contentType === '数据产品目录' && (
                <Descriptions.Item label="关联数据产品">
                  <Space size={[0, 8]} wrap>
                    {editingPublishingTask.associatedDataProducts?.map((product: string) => (
                      <Tag key={product}>{product}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="计划发布时间">
                <Space>
                  <CalendarIcon size={14} />
                  {editingPublishingTask.plannedPublishTime}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge 
                  status={
                    editingPublishingTask.status === '已通过' ? 'success' :
                    editingPublishingTask.status === '待审核' ? 'processing' :
                    editingPublishingTask.status === '已驳回' ? 'error' : 'warning'
                  } 
                  text={editingPublishingTask.status} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="发布说明">{editingPublishingTask.description}</Descriptions.Item>
            </Descriptions>

            <div className="space-y-3">
              <Title level={5} style={{ margin: 0 }}>发布内容</Title>
              <Card size="small" className="bg-gray-50">
                <Paragraph>{editingPublishingTask.content}</Paragraph>
              </Card>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default OperationCenter;
