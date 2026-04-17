import React, { useState } from 'react';
import { 
  Layout, Menu, Button, Table, Space, 
  Typography, Card, Input, Tag, InputNumber,
  Modal, Form, TreeSelect, message, Switch, Badge, Select,
  Collapse, Drawer, Descriptions, Divider
} from 'antd';
import { 
  Plus, Search, Edit, Trash2, 
  Layers, Tag as TagIcon, BarChart, 
  Ruler, FileCode, AlertCircle,
  Info, CheckCircle2, XCircle,
  ClipboardList, Calendar as CalendarIcon, FileText as FileTextIcon
} from 'lucide-react';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface BaseItem {
  key: string;
  name: string;
  code: string;
  description: string;
  children?: any[];
}

interface SpaceType extends BaseItem {
  parentId?: string;
  status: 'enabled' | 'disabled';
  createTime: string;
  children?: SpaceType[];
}

interface DataClassification extends BaseItem {
  parentId?: string;
  spaceName: string;
  children?: DataClassification[];
}

interface DataGrading extends BaseItem {
  securityLevel: '公开' | '内部' | '秘密' | '绝密';
  applicableDomains: string[];
  processingRequirements: string;
  createTime: string;
}

interface DimensionStandard extends BaseItem {
  dimensionType: 'csv' | 'json' | 'docx';
  fileSizeMb: number;
  applicableScenarios: string;
  dimensionDefinition?: string; // JSON string
  status: 'enabled' | 'deprecated';
  creator: string;
  createTime: string;
  lastUpdate: string;
}

interface QualityRuleTemplate extends BaseItem {
  validationDimension: '完整性' | '准确性' | '唯一性' | '一致性' | '及时性';
  ruleLogic: any; // Dynamic form content
  createTime: string;
}

interface MetadataField {
  id: string;
  displayName: string;
  dataType: '字符串' | '数字' | '日期' | '布尔值' | '枚举列表';
  required: boolean;
}

interface MetadataStandard extends BaseItem {
  metadataType: '基础属性' | '业务属性' | '管理属性' | '技术属性';
  applicableBusinessDomains: string[];
  fields: MetadataField[];
  status: '生效' | '废止';
  lastUpdate: string;
}

const ConfigCenter: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('metadata-standard'); // Default to metadata-standard for now
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<any>(null); // Can be SpaceType, DataGrading, etc.
  const [form] = Form.useForm();

  // State for dynamic rule logic in QualityRuleTemplate
  const [ruleValidationDimension, setRuleValidationDimension] = useState<QualityRuleTemplate['validationDimension']>('完整性');

  // --- Simulated Data ---
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([
    {
      key: 'st_1', name: '私有空间', code: 'PRIVATE', description: '个人或小团队私密数据处理空间', status: 'enabled', createTime: '2023-01-01',
      children: [{ key: 'st_1_1', name: '个人工作区', code: 'PERSONAL', description: '个人数据分析与实验', status: 'enabled', createTime: '2023-03-15', parentId: 'st_1' }]
    },
    { key: 'st_2', name: '协作空间', code: 'COLLAB', description: '团队协作数据共享与分析空间', status: 'enabled', createTime: '2023-02-10' },
    { key: 'st_3', name: '公开数据市场', code: 'PUBLIC_MARKET', description: '对外开放的数据产品发布与交易平台', status: 'enabled', createTime: '2023-04-01' },
  ]);

  const [dataClassifications, setDataClassifications] = useState<DataClassification[]>([
    {
      key: '1', name: '业务数据', code: 'BIZ_DATA', description: '核心业务流程产生的数据', spaceName: '协作空间',
      children: [
        {
          key: '1-1', name: '财务数据', code: 'FIN_DATA', description: '涉及收支、账单、预算等信息', spaceName: '协作空间',
          children: [
            { key: '1-1-1', name: '收入流水', code: 'INC_FLOW', description: '每日收入明细', spaceName: '协作空间' },
            { key: '1-1-2', name: '支出明细', code: 'EXP_FLOW', description: '运营支出记录', spaceName: '协作空间' },
          ]
        },
        { key: '1-2', name: '营销数据', code: 'MKT_DATA', description: '活动转化、获客成本等数据', spaceName: '公开数据市场' },
      ],
    },
    {
      key: '2', name: '管理数据', code: 'MGMT_DATA', description: '内部行政与人力资源数据', spaceName: '私有空间',
      children: [
        { key: '2-1', name: '人力资源', code: 'HR_DATA', description: '员工档案、考勤数据', spaceName: '私有空间' },
        { key: '2-2', name: '行政资产', code: 'ASSET_DATA', description: '办公用品与固定资产', spaceName: '私有空间' },
      ],
    },
  ]);

  const [dataGradings, setDataGradings] = useState<DataGrading[]>([
    { key: 'dg_1', name: 'L1-公开', code: 'L1_PUBLIC', securityLevel: '公开', applicableDomains: ['产品信息', '公开报告'], processingRequirements: '无特殊要求', description: '可对外公开的数据', createTime: '2023-05-01' },
    { key: 'dg_2', name: 'L2-内部', code: 'L2_INTERNAL', securityLevel: '内部', applicableDomains: ['用户信息', '交易数据'], processingRequirements: '内部访问控制，脱敏处理', description: '仅限内部员工访问的数据', createTime: '2023-06-10' },
    { key: 'dg_3', name: 'L3-秘密', code: 'L3_SECRET', securityLevel: '秘密', applicableDomains: ['财务报表', '核心算法'], processingRequirements: '严格权限控制，加密存储，审计日志', description: '核心敏感数据', createTime: '2023-07-20' },
  ]);

  const [dimensionStandards, setDimensionStandards] = useState<DimensionStandard[]>([
    { key: 'ds_1', name: 'CSV 维度标准', code: 'DIM_CSV', dimensionType: 'csv', fileSizeMb: 100, applicableScenarios: '批量数据导入分析', dimensionDefinition: '{"delimiter": ",", "hasHeader": true}', status: 'enabled', creator: '系统管理员', createTime: '2024-01-01 09:30:00', lastUpdate: '2024-01-01 09:30:00', description: '用于 CSV 结构化文件的维度标准' },
    { key: 'ds_2', name: 'JSON 维度标准', code: 'DIM_JSON', dimensionType: 'json', fileSizeMb: 50, applicableScenarios: '半结构化数据处理', dimensionDefinition: '{"path": "$.items[*]", "fields": ["id", "name"]}', status: 'enabled', creator: '数据治理专员', createTime: '2024-02-15 14:10:00', lastUpdate: '2024-02-15 14:10:00', description: '用于 JSON 数据结构解析的维度标准' },
    { key: 'ds_3', name: 'DOCX 维度标准', code: 'DIM_DOCX', dimensionType: 'docx', fileSizeMb: 20, applicableScenarios: '文档内容结构提取', dimensionDefinition: '{"sections": ["标题", "正文", "附件"]}', status: 'enabled', creator: '空间管理员', createTime: '2024-03-01 11:00:00', lastUpdate: '2024-03-01 11:00:00', description: '用于 DOCX 文档内容分析的维度标准' },
  ]);

  const [qualityRuleTemplates, setQualityRuleTemplates] = useState<QualityRuleTemplate[]>([
    { key: 'qrt_1', name: '非空率检查模板', code: 'NON_NULL_RATE', validationDimension: '完整性', ruleLogic: { field: 'user_id', threshold: 99 }, description: '检查指定字段的非空率是否达到阈值', createTime: '2023-08-01' },
    { key: 'qrt_2', name: '手机号格式检查', code: 'PHONE_FORMAT', validationDimension: '准确性', ruleLogic: { field: 'phone_number', regex: '^1[3-9]\\d{9}$' }, description: '检查手机号字段是否符合中国大陆手机号格式', createTime: '2023-09-10' },
    { key: 'qrt_3', name: '主键唯一性检查', code: 'PK_UNIQUE', validationDimension: '唯一性', ruleLogic: { fields: ['order_id', 'item_id'] }, description: '检查订单明细表的主键组合是否唯一', createTime: '2023-10-05' },
  ]);

  const [metadataStandards, setMetadataStandards] = useState<MetadataStandard[]>([
    {
      key: 'ms_1',
      name: '核心业务元数据',
      code: 'CORE_BIZ_META',
      description: '定义核心业务数据的通用描述标准',
      metadataType: '业务属性',
      applicableBusinessDomains: ['用户数据', '订单数据'],
      status: '生效',
      lastUpdate: '2024-03-20 14:30:00',
      fields: [
        { id: 'dataOwner', displayName: '数据负责人', dataType: '字符串', required: true },
        { id: 'dataSecurityLevel', displayName: '安全等级', dataType: '枚举列表', required: true },
      ]
    },
    {
      key: 'ms_2',
      name: '技术元数据标准',
      code: 'TECH_META',
      description: '数据存储与物理结构的描述标准',
      metadataType: '技术属性',
      applicableBusinessDomains: ['日志数据'],
      status: '生效',
      lastUpdate: '2024-03-15 09:00:00',
      fields: [
        { id: 'storageFormat', displayName: '存储格式', dataType: '字符串', required: true },
        { id: 'partitionField', displayName: '分区字段', dataType: '字符串', required: false },
      ]
    }
  ]);

  const [metadataLoading, setMetadataLoading] = useState(selectedKey === 'metadata-standard');

  React.useEffect(() => {
    if (selectedKey === 'metadata-standard') {
      const timer = setTimeout(() => setMetadataLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedKey]);

  // Simulate loading on tab switch
  const handleTabChange = (key: string) => {
    setSelectedKey(key);
    if (key === 'metadata-standard') {
      setMetadataLoading(true);
      setTimeout(() => setMetadataLoading(false), 800);
    }
  };

  // --- Menu Items ---
  const menuItems = [
    { key: 'space-type', label: '空间类型', icon: <Layers size={16} /> },
    { key: 'data-classification', label: '数据分类', icon: <TagIcon size={16} /> },
    { key: 'data-grading', label: '数据分级', icon: <BarChart size={16} /> },
    { key: 'dimension-standard', label: '维度标准', icon: <Ruler size={16} /> },
    { key: 'metadata-standard', label: '元数据标准', icon: <ClipboardList size={16} /> },
    { key: 'quality-template', label: '质量规则模板', icon: <FileCode size={16} /> },
  ];

  // --- Generic Modal Handlers ---
  const handleAdd = (key: string) => {
    setModalType('add');
    setEditingItem(null);
    form.resetFields();
    if (key === 'quality-template') {
      setRuleValidationDimension('完整性'); // Reset for new rule template
      form.setFieldsValue({ validationDimension: '完整性' });
    }
    setModalVisible(true);
  };

  const handleEdit = (record: any, key: string) => {
    setModalType('edit');
    setEditingItem(record);
    form.setFieldsValue(record);
    if (key === 'quality-template') {
      setRuleValidationDimension(record.validationDimension);
    }
    setModalVisible(true);
  };

  const handleModalSubmit = () => {
    form.validateFields().then(values => {
      message.loading('正在保存...', 1).then(() => {
        message.success(modalType === 'add' ? '新增成功' : '编辑成功');
        
        if (selectedKey === 'metadata-standard') {
          if (modalType === 'add') {
            const newItem: MetadataStandard = {
              ...values,
              key: `ms_${Date.now()}`,
              code: values.name.toUpperCase().replace(/\s+/g, '_'),
              status: '生效',
              lastUpdate: new Date().toLocaleString(),
            };
            setMetadataStandards(prev => [newItem, ...prev]);
          } else {
            setMetadataStandards(prev => prev.map(item => 
              item.key === editingItem.key ? { ...item, ...values, lastUpdate: new Date().toLocaleString() } : item
            ));
          }
        } else if (selectedKey === 'dimension-standard') {
          if (modalType === 'add') {
            const newItem: DimensionStandard = {
              ...values,
              key: `ds_${Date.now()}`,
              code: values.name.toUpperCase().replace(/\s+/g, '_'),
              status: 'enabled',
              creator: '当前用户',
              createTime: new Date().toLocaleString(),
              lastUpdate: new Date().toLocaleString(),
            };
            setDimensionStandards(prev => [newItem, ...prev]);
          } else {
            setDimensionStandards(prev => prev.map(item => 
              item.key === editingItem.key ? { ...item, ...values, lastUpdate: new Date().toLocaleDateString() } : item
            ));
          }
        } else if (selectedKey === 'data-classification') {
          if (modalType === 'add') {
            const newItem: DataClassification = {
              ...values,
              key: `dc_${Date.now()}`,
            };
            setDataClassifications(prev => [newItem, ...prev]);
          } else {
            setDataClassifications(prev => prev.map(item =>
              item.key === editingItem.key ? { ...item, ...values } : item
            ));
          }
        }
        
        setModalVisible(false);
      });
    });
  };

  // --- Space Type Specific Handlers ---
  const handleSpaceTypeStatusChange = (checked: boolean, record: SpaceType) => {
    message.loading('正在更新状态...', 0.5).then(() => {
      setSpaceTypes(prev => prev.map(item => 
        item.key === record.key ? { ...item, status: checked ? 'enabled' : 'disabled' } : item
      ));
      message.success('状态更新成功');
    });
  };

  const handleDeleteSpaceType = (record: SpaceType) => {
    Modal.confirm({
      title: '确认删除空间类型',
      icon: <AlertCircle className="text-red-500" />,
      content: (
        <div>
          <p>确定要删除空间类型 <Text strong>"{record.name}"</Text> 吗？</p>
          <Text type="danger" className="text-xs">注意：若已有空间使用此类型，则无法删除。</Text>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.loading('正在检查引用状态...', 1).then(() => {
          message.success('空间类型已成功删除');
          setSpaceTypes(prev => prev.filter(item => item.key !== record.key));
        });
      }
    });
  };

  // --- Data Grading Specific Handlers ---
  const handleDeleteDataGrading = (record: DataGrading) => {
    Modal.confirm({
      title: '确认删除数据分级',
      icon: <AlertCircle className="text-red-500" />,
      content: `确定要删除数据分级 "${record.name}" 吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.loading('正在删除...', 1).then(() => {
          message.success('数据分级已成功删除');
          setDataGradings(prev => prev.filter(item => item.key !== record.key));
        });
      }
    });
  };

  // --- Dimension Standard Specific Handlers ---
  const [dimensionDetailVisible, setDimensionDetailVisible] = useState(false);
  const showDimensionDetail = (record: DimensionStandard) => {
    setEditingItem(record);
    setDimensionDetailVisible(true);
  };

  const handleDimensionStatusChange = (checked: boolean, record: DimensionStandard) => {
    message.loading('正在更新状态...', 0.5).then(() => {
      setDimensionStandards(prev => prev.map(item => 
        item.key === record.key ? { ...item, status: checked ? 'enabled' : 'deprecated' } : item
      ));
      message.success('状态更新成功');
    });
  };

  // --- Quality Rule Template Specific Handlers ---
  const handleDeleteQualityRuleTemplate = (record: QualityRuleTemplate) => {
    Modal.confirm({
      title: '确认删除质量规则模板',
      icon: <AlertCircle className="text-red-500" />,
      content: `确定要删除质量规则模板 "${record.name}" 吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.loading('正在删除...', 1).then(() => {
          message.success('质量规则模板已成功删除');
          setQualityRuleTemplates(prev => prev.filter(item => item.key !== record.key));
        });
      }
    });
  };

  // --- Metadata Standard Specific Handlers ---
  const [metadataDetailVisible, setMetadataDetailVisible] = useState(false);
  const showMetadataDetail = (record: MetadataStandard) => {
    setEditingItem(record);
    setMetadataDetailVisible(true);
  };

  // Content Publishing Detail Drawer Visibility
  const [contentPublishingDetailVisible, setContentPublishingDetailVisible] = useState(false);

  const handleMetadataStatusChange = (record: MetadataStandard) => {
    const isEffective = record.status === '生效';
    const actionText = isEffective ? '废止' : '恢复';
    
    Modal.confirm({
      title: `确认${actionText}`,
      icon: <AlertCircle className={isEffective ? "text-red-500" : "text-green-500"} />,
      content: isEffective 
        ? `确定要废止标准“${record.name}”吗？废止后，新创建的数据资源将无法选用此标准。`
        : `确定要恢复标准“${record.name}”吗？`,
      okText: `确认${actionText}`,
      okType: isEffective ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: () => {
        message.loading(`正在${actionText}...`, 0.5).then(() => {
          setMetadataStandards(prev => prev.map(item => 
            item.key === record.key ? { ...item, status: isEffective ? '废止' : '生效', lastUpdate: new Date().toLocaleString() } : item
          ));
          message.success(`${actionText}成功`);
        });
      }
    });
  };

  // --- Render Content ---
  const renderContent = () => {
    switch (selectedKey) {
      case 'space-type':
        const spaceTypeColumns = [
          { title: '类型名称', dataIndex: 'name', key: 'name' },
          { title: '类型编码', dataIndex: 'code', key: 'code', render: (code: string) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{code}</code> },
          { title: '描述', dataIndex: 'description', key: 'description', render: (desc: string) => <Text type="secondary" className="text-sm">{desc}</Text> },
          { title: '状态', dataIndex: 'status', key: 'status', render: (status: 'enabled' | 'disabled') => (
            <Badge status={status === 'enabled' ? 'success' : 'error'} text={status === 'enabled' ? '启用' : '禁用'} />
          )},
          { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
          {
            title: '操作', key: 'action', width: 200,
            render: (_: any, record: SpaceType) => (
              <Space size="middle">
                <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>编辑</Button>
                <Button 
                  type="link" 
                  size="small" 
                  icon={record.status === 'enabled' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  danger={record.status === 'enabled'}
                  onClick={() => handleSpaceTypeStatusChange(record.status !== 'enabled', record)}
                >
                  {record.status === 'enabled' ? '禁用' : '启用'}
                </Button>
                <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => handleDeleteSpaceType(record)}>删除</Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>空间类型管理</Title>
                <Input 
                  placeholder="搜索类型名称或编码" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={() => handleAdd(selectedKey)}>
                新增空间类型
              </Button>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={spaceTypeColumns} 
                dataSource={spaceTypes} 
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                className="config-tree-table"
              />
            </Card>
          </div>
        );

      case 'data-classification':
        const dataClassificationColumns = [
          { title: '分类名称', dataIndex: 'name', key: 'name' },
          { title: '应用空间', dataIndex: 'spaceName', key: 'spaceName' },
          { title: '分类编码', dataIndex: 'code', key: 'code', render: (code: string) => <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{code}</code> },
          { title: '描述', dataIndex: 'description', key: 'description', render: (desc: string) => <Text type="secondary" className="text-sm">{desc}</Text> },
          {
            title: '操作', key: 'action', width: 150,
            render: (_: any, record: DataClassification) => (
              <Space size="middle">
                <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>编辑</Button>
                <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => Modal.confirm({
                  title: '确认删除分类',
                  icon: <AlertCircle className="text-red-500" />,
                  content: (
                    <div>
                      <p>确定要删除分类 <Text strong>"{record.name}"</Text> 吗？</p>
                      <Text type="danger" className="text-xs">注意：若此分类已被数据资源使用，则无法删除。</Text>
                    </div>
                  ),
                  okText: '确认删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => {
                    message.loading('正在检查引用状态...', 1).then(() => {
                      message.success('分类已成功删除');
                      setDataClassifications(prev => prev.filter(item => item.key !== record.key));
                    });
                  }
                })}>删除</Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>数据分类管理</Title>
                <Input 
                  placeholder="搜索分类名称或编码" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={() => handleAdd(selectedKey)}>
                新增分类
              </Button>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={dataClassificationColumns} 
                dataSource={dataClassifications} 
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                className="config-tree-table"
              />
            </Card>
          </div>
        );

      case 'data-grading':
        const dataGradingColumns = [
          { title: '分级名称', dataIndex: 'name', key: 'name' },
          { title: '安全级别', dataIndex: 'securityLevel', key: 'securityLevel', render: (level: DataGrading['securityLevel']) => {
            let color = 'default';
            if (level === '公开') color = 'green';
            else if (level === '内部') color = 'blue';
            else if (level === '秘密') color = 'orange';
            else if (level === '绝密') color = 'red';
            return <Tag color={color}>{level}</Tag>;
          }},
          { title: '适用数据域', dataIndex: 'applicableDomains', key: 'applicableDomains', render: (domains: string[]) => (
            <Space size={[0, 8]} wrap>
              {domains.map(domain => <Tag key={domain}>{domain}</Tag>)}
            </Space>
          )},
          { title: '描述', dataIndex: 'description', key: 'description', render: (desc: string) => <Text type="secondary" className="text-sm">{desc}</Text> },
          { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
          {
            title: '操作', key: 'action', width: 150,
            render: (_: any, record: DataGrading) => (
              <Space size="middle">
                <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>编辑</Button>
                <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => handleDeleteDataGrading(record)}>删除</Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>数据分级管理</Title>
                <Input 
                  placeholder="搜索分级名称" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={() => handleAdd(selectedKey)}>
                新增数据分级
              </Button>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={dataGradingColumns} 
                dataSource={dataGradings} 
                pagination={false}
                className="config-table"
              />
            </Card>
          </div>
        );

      case 'dimension-standard':
        const dimensionStandardColumns = [
          { title: '标准名称', dataIndex: 'name', key: 'name' },
          { title: '维度类型', dataIndex: 'dimensionType', key: 'dimensionType', render: (type: string) => {
            let color = 'default';
            if (type === 'csv') color = 'blue';
            else if (type === 'json') color = 'green';
            else if (type === 'docx') color = 'purple';
            return <Tag color={color}>{type}</Tag>;
          }},
          { title: '状态', dataIndex: 'status', key: 'status', render: (status: 'enabled' | 'deprecated') => (
            <Badge status={status === 'enabled' ? 'success' : 'error'} text={status === 'enabled' ? '生效' : '废止'} />
          )},
          { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate' },
          {
            title: '操作', key: 'action', width: 200,
            render: (_: any, record: DimensionStandard) => (
              <Space size="middle">
                <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>编辑</Button>
                <Button type="link" size="small" icon={<Info size={14} />} onClick={() => showDimensionDetail(record)}>详情</Button>
                <Button 
                  type="link" 
                  size="small" 
                  icon={record.status === 'enabled' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  danger={record.status === 'enabled'}
                  onClick={() => handleDimensionStatusChange(record.status !== 'enabled', record)}
                >
                  {record.status === 'enabled' ? '废止' : '恢复'}
                </Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>维度标准管理</Title>
                <Input 
                  placeholder="搜索标准名称或类型" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Space>
                <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={() => handleAdd(selectedKey)}>
                  新增维度标准
                </Button>
              </Space>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={dimensionStandardColumns} 
                dataSource={dimensionStandards} 
                pagination={false}
                className="config-table"
              />
            </Card>
          </div>
        );

      case 'metadata-standard':
        const metadataColumns = [
          { 
            title: '标准名称', 
            dataIndex: 'name', 
            key: 'name',
            render: (text: string, record: MetadataStandard) => (
              <Button type="link" className="p-0 h-auto font-medium" onClick={() => showMetadataDetail(record)}>{text}</Button>
            )
          },
          { 
            title: '元数据类型', 
            dataIndex: 'metadataType', 
            key: 'metadataType',
            render: (type: string) => {
              let color = 'blue';
              if (type === '业务属性') color = 'orange';
              if (type === '管理属性') color = 'green';
              if (type === '技术属性') color = 'purple';
              return <Tag color={color}>{type}</Tag>;
            }
          },
          { 
            title: '状态', 
            dataIndex: 'status', 
            key: 'status',
            render: (status: '生效' | '废止') => (
              <Badge status={status === '生效' ? 'success' : 'error'} text={status} />
            )
          },
          { title: '最后更新', dataIndex: 'lastUpdate', key: 'lastUpdate' },
          {
            title: '操作', key: 'action', width: 220,
            render: (_: any, record: MetadataStandard) => (
              <Space size="middle">
                {record.status === '生效' && (
                  <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>
                    编辑
                  </Button>
                )}
                <Button type="link" size="small" icon={<Info size={14} />} onClick={() => showMetadataDetail(record)}>详情</Button>
                <Button 
                  type="link" 
                  size="small" 
                  danger={record.status === '生效'}
                  onClick={() => handleMetadataStatusChange(record)}
                >
                  {record.status === '生效' ? '废止' : '恢复'}
                </Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>元数据标准管理</Title>
                <Input 
                  placeholder="搜索标准名称或类型" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Button 
                type="primary" 
                icon={<Plus size={16} />} 
                className="flex items-center gap-1"
                onClick={() => handleAdd(selectedKey)}
              >
                新增元数据标准
              </Button>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={metadataColumns} 
                dataSource={[...metadataStandards].sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())} 
                pagination={{ pageSize: 10 }}
                loading={metadataLoading}
                className="config-table"
              />
            </Card>
          </div>
        );

      case 'quality-template':
        const qualityRuleTemplateColumns = [
          { title: '模板名称', dataIndex: 'name', key: 'name' },
          { title: '校验维度', dataIndex: 'validationDimension', key: 'validationDimension', render: (dim: string) => <Tag>{dim}</Tag> },
          { title: '规则描述', dataIndex: 'description', key: 'description', render: (desc: string) => <Text type="secondary" className="text-sm">{desc}</Text> },
          { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
          {
            title: '操作', key: 'action', width: 150,
            render: (_: any, record: QualityRuleTemplate) => (
              <Space size="middle">
                <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => handleEdit(record, selectedKey)}>编辑</Button>
                <Button type="link" danger size="small" icon={<Trash2 size={14} />} onClick={() => handleDeleteQualityRuleTemplate(record)}>删除</Button>
              </Space>
            ),
          },
        ];
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Title level={4} style={{ margin: 0 }}>质量规则模板管理</Title>
                <Input 
                  placeholder="搜索模板名称或维度" 
                  prefix={<Search size={16} className="text-gray-400" />} 
                  className="w-64"
                />
              </div>
              <Button type="primary" icon={<Plus size={16} />} className="flex items-center gap-1" onClick={() => handleAdd(selectedKey)}>
                新建规则模板
              </Button>
            </div>
            <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
              <Table 
                columns={qualityRuleTemplateColumns} 
                dataSource={qualityRuleTemplates} 
                pagination={false}
                className="config-table"
              />
            </Card>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Text type="secondary">{menuItems.find(i => i.key === selectedKey)?.label} 配置模块正在开发中...</Text>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={3} style={{ margin: 0 }}>空间配置中心</Title>
      </div>

      <Layout className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 min-h-[600px]">
        <Sider 
          width={220} 
          theme="light" 
          className="border-r border-gray-100"
          style={{ background: '#fcfcfc' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => handleTabChange(key)}
            items={menuItems}
            className="border-none pt-2"
            style={{ background: 'transparent' }}
          />
        </Sider>
        
        <Content className="p-6 bg-white">
          {renderContent()}
        </Content>
      </Layout>

      {/* Generic Add/Edit Modal */}
      <Modal
        title={
          modalType === 'add' 
            ? `新增${menuItems.find(i => i.key === selectedKey)?.label}` 
            : `编辑${menuItems.find(i => i.key === selectedKey)?.label}`
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalSubmit}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          {selectedKey === 'space-type' && (
            <>
              <Form.Item name="name" label="类型名称" rules={[{ required: true, message: '请输入类型名称' }]}>
                <Input placeholder="输入空间类型名称" />
              </Form.Item>
              <Form.Item name="code" label="类型编码" rules={[{ required: true, message: '请输入类型编码' }]}>
                <Input placeholder="输入类型编码，例如: PRIVATE" />
              </Form.Item>
              <Form.Item name="parentId" label="父级类型">
                <TreeSelect
                  placeholder="选择父级类型（不选则为根节点）"
                  allowClear
                  treeDefaultExpandAll
                  treeData={spaceTypes.map(item => ({
                    title: item.name,
                    value: item.key,
                    children: item.children?.map(child => ({
                      title: child.name,
                      value: child.key
                    }))
                  }))}
                />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="描述空间类型的用途" />
              </Form.Item>
            </>
          )}

          {selectedKey === 'data-classification' && (
            <>
              <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
                <Input placeholder="输入分类名称" />
              </Form.Item>
              <Form.Item name="spaceName" label="空间名称" rules={[{ required: true, message: '请选择空间名称' }]}>
                <Select placeholder="请选择空间名称">
                  {spaceTypes.map(spaceType => (
                    <Select.Option key={spaceType.key} value={spaceType.name}>
                      {spaceType.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="parentId" label="父级分类">
                <TreeSelect
                  placeholder="选择父级分类（不选则为根节点）"
                  allowClear
                  treeDefaultExpandAll
                  treeData={dataClassifications.map(item => ({
                    title: item.name,
                    value: item.key,
                    children: item.children?.map(child => ({
                      title: child.name,
                      value: child.key
                    }))
                  }))}
                />
              </Form.Item>
              <Form.Item name="code" label="分类编码" rules={[{ required: true, message: '请输入分类编码' }]}>
                <Input placeholder="输入分类编码，例如: BIZ_DATA" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="描述分类的用途" />
              </Form.Item>
            </>
          )}

          {selectedKey === 'data-grading' && (
            <>
              <Form.Item name="name" label="分级名称" rules={[{ required: true, message: '请输入分级名称' }]}>
                <Input placeholder="输入数据分级名称，例如：L1-公开" />
              </Form.Item>
              <Form.Item name="securityLevel" label="安全级别" rules={[{ required: true, message: '请选择安全级别' }]}>
                <Select placeholder="选择安全级别">
                  <Select.Option value="公开">公开</Select.Option>
                  <Select.Option value="内部">内部</Select.Option>
                  <Select.Option value="秘密">秘密</Select.Option>
                  <Select.Option value="绝密">绝密</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="applicableDomains" label="适用数据域">
                <Select mode="multiple" placeholder="选择适用数据域">
                  <Select.Option value="用户信息">用户信息</Select.Option>
                  <Select.Option value="交易数据">交易数据</Select.Option>
                  <Select.Option value="日志数据">日志数据</Select.Option>
                  <Select.Option value="产品信息">产品信息</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="processingRequirements" label="处理要求">
                <Input.TextArea rows={3} placeholder="描述此级别数据的存储、传输、脱敏、审计等要求" />
              </Form.Item>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="描述数据分级的用途和意义" />
              </Form.Item>
            </>
          )}

          {selectedKey === 'dimension-standard' && (
            <>
              <Form.Item name="name" label="标准名称" rules={[{ required: true, message: '请输入标准名称' }]}>
                <Input placeholder="输入维度标准名称" />
              </Form.Item>
              <Form.Item name="dimensionType" label="维度类型" rules={[{ required: true, message: '请选择维度类型' }]}>
                <Select placeholder="选择维度类型">
                  <Select.Option value="csv">csv</Select.Option>
                  <Select.Option value="json">json</Select.Option>
                  <Select.Option value="docx">docx</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="fileSizeMb"
                label="文件大小（MB）"
                rules={[
                  { required: true, message: '请输入文件大小' },
                  { type: 'number', min: 1, message: '文件大小需大于 0' }
                ]}
              >
                <InputNumber min={1} precision={0} placeholder="请输入文件大小（MB）" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="applicableScenarios" label="适用场景">
                <Input.TextArea rows={3} placeholder="描述此维度标准的适用场景" />
              </Form.Item>
            </>
          )}

          {selectedKey === 'quality-template' && (
            <>
              <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
                <Input placeholder="输入质量规则模板名称" />
              </Form.Item>
              <Form.Item name="validationDimension" label="校验维度" rules={[{ required: true, message: '请选择校验维度' }]}>
                <Select placeholder="选择校验维度" onChange={(value: QualityRuleTemplate['validationDimension']) => setRuleValidationDimension(value)}>
                  <Select.Option value="完整性">完整性</Select.Option>
                  <Select.Option value="准确性">准确性</Select.Option>
                  <Select.Option value="唯一性">唯一性</Select.Option>
                  <Select.Option value="一致性">一致性</Select.Option>
                  <Select.Option value="及时性">及时性</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="规则逻辑">
                <Card size="small" className="bg-gray-50">
                  {ruleValidationDimension === '完整性' && (
                    <Space>
                      <span>字段:</span>
                      <Select placeholder="选择字段" style={{ width: 120 }}>
                        <Select.Option value="field1">字段1</Select.Option>
                        <Select.Option value="field2">字段2</Select.Option>
                      </Select>
                      <span>的非空率 &gt;=</span>
                      <Input style={{ width: 80 }} suffix="%" defaultValue={99} />
                    </Space>
                  )}
                  {ruleValidationDimension === '唯一性' && (
                    <Space>
                      <span>字段组合:</span>
                      <Select mode="multiple" placeholder="选择字段" style={{ width: 200 }}>
                        <Select.Option value="fieldA">字段A</Select.Option>
                        <Select.Option value="fieldB">字段B</Select.Option>
                      </Select>
                      <span>的值必须唯一。</span>
                    </Space>
                  )}
                  {ruleValidationDimension === '准确性' && (
                    <Space>
                      <span>字段:</span>
                      <Select placeholder="选择字段" style={{ width: 120 }}>
                        <Select.Option value="fieldX">字段X</Select.Option>
                        <Select.Option value="fieldY">字段Y</Select.Option>
                      </Select>
                      <span>的值必须符合正则表达式:</span>
                      <Input style={{ width: 200 }} placeholder="例如: ^[A-Z]{2}\\d{4}$" />
                    </Space>
                  )}
                  {(ruleValidationDimension === '一致性' || ruleValidationDimension === '及时性') && (
                    <Text type="secondary">请配置 {ruleValidationDimension} 的规则逻辑。</Text>
                  )}
                </Card>
              </Form.Item>
              <Form.Item name="description" label="规则描述">
                <Input.TextArea rows={3} placeholder="说明此模板的用途和业务意义" />
              </Form.Item>
            </>
          )}

          {selectedKey === 'metadata-standard' && (
            <>
              <Form.Item name="name" label="标准名称" rules={[{ required: true, message: '请输入标准名称' }, { max: 50, message: '最大长度50字符' }]}>
                <Input placeholder="请输入标准名称，如‘核心业务元数据’" />
              </Form.Item>
              <Form.Item name="metadataType" label="元数据类型" rules={[{ required: true, message: '请选择元数据类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="基础属性">基础属性</Select.Option>
                  <Select.Option value="业务属性">业务属性</Select.Option>
                  <Select.Option value="管理属性">管理属性</Select.Option>
                  <Select.Option value="技术属性">技术属性</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="applicableBusinessDomains" label="适用业务域">
                <Select mode="tags" placeholder="输入后按回车键添加标签，如‘用户数据’、‘订单数据’" style={{ width: '100%' }} />
                <Text type="secondary" className="text-xs mt-1 block">例如：用户数据， 交易数据， 日志数据</Text>
              </Form.Item>
              
              <Divider className="m-0 mb-4">字段定义</Divider>
              <Collapse defaultActiveKey={['fields']} ghost>
                <Panel header={<Text strong>字段定义（至少定义一个字段）</Text>} key="fields">
                  <Form.List 
                    name="fields" 
                    initialValue={[{ id: '', displayName: '', dataType: '字符串', required: true }]}
                    rules={[{
                      validator: async (_, names) => {
                        if (!names || names.length < 1) {
                          return Promise.reject(new Error('至少需要定义一个字段'));
                        }
                      },
                    }]}
                  >
                    {(fields, { add, remove }) => (
                      <div className="space-y-4">
                        <Table
                          dataSource={fields}
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: '字段标识',
                              dataIndex: 'id',
                              key: 'id',
                              render: (_, field) => (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'id']}
                                  rules={[{ required: true, message: '请输入字段标识' }]}
                                  noStyle
                                >
                                  <Input placeholder="英文或拼音" />
                                </Form.Item>
                              )
                            },
                            {
                              title: '显示名称',
                              dataIndex: 'displayName',
                              key: 'displayName',
                              render: (_, field) => (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'displayName']}
                                  rules={[{ required: true, message: '请输入显示名称' }]}
                                  noStyle
                                >
                                  <Input placeholder="中文名称" />
                                </Form.Item>
                              )
                            },
                            {
                              title: '数据类型',
                              dataIndex: 'dataType',
                              key: 'dataType',
                              width: 120,
                              render: (_, field) => (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'dataType']}
                                  rules={[{ required: true, message: '请选择' }]}
                                  noStyle
                                >
                                  <Select placeholder="请选择">
                                    <Select.Option value="字符串">字符串</Select.Option>
                                    <Select.Option value="数字">数字</Select.Option>
                                    <Select.Option value="日期">日期</Select.Option>
                                    <Select.Option value="布尔值">布尔值</Select.Option>
                                    <Select.Option value="枚举列表">枚举列表</Select.Option>
                                  </Select>
                                </Form.Item>
                              )
                            },
                            {
                              title: '必填',
                              dataIndex: 'required',
                              key: 'required',
                              width: 80,
                              align: 'center',
                              render: (_, field) => (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'required']}
                                  valuePropName="checked"
                                  noStyle
                                >
                                  <Switch size="small" />
                                </Form.Item>
                              )
                            },
                            {
                              title: '操作',
                              key: 'action',
                              width: 60,
                              align: 'center',
                              render: (_, field) => (
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<Trash2 size={14} />} 
                                  onClick={() => remove(field.name)}
                                />
                              )
                            }
                          ]}
                        />
                        <Button 
                          type="dashed" 
                          onClick={() => add({ dataType: '字符串', required: true })} 
                          block 
                          icon={<Plus size={14} />}
                        >
                          添加字段
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Panel>
              </Collapse>
            </>
          )}
        </Form>
      </Modal>

      {/* Content Publishing Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileTextIcon size={20} className="text-blue-500" />
            <span>内容发布任务详情: {editingItem?.title}</span>
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
        {contentPublishingDetailVisible && editingItem && (
          <div className="space-y-6">
            <Descriptions title="基本信息" column={1} bordered size="small">
              <Descriptions.Item label="发布标题">{editingItem.title}</Descriptions.Item>
              <Descriptions.Item label="内容类型">
                <Tag color="blue">{editingItem.contentType}</Tag>
              </Descriptions.Item>
              {editingItem.contentType === '数据产品目录' && (
                <Descriptions.Item label="关联数据产品">
                  <Space size={[0, 8]} wrap>
                    {editingItem.associatedDataProducts?.map((product: string) => (
                      <Tag key={product}>{product}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="计划发布时间">
                <Space>
                  <CalendarIcon size={14} />
                  {editingItem.plannedPublishTime}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge 
                  status={
                    editingItem.status === '已通过' ? 'success' :
                    editingItem.status === '待审核' ? 'processing' :
                    editingItem.status === '已驳回' ? 'error' : 'warning'
                  } 
                  text={editingItem.status} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="发布说明">{editingItem.description}</Descriptions.Item>
            </Descriptions>

            <div className="space-y-3">
              <Title level={5} style={{ margin: 0 }}>发布内容</Title>
              <Card size="small" className="bg-gray-50">
                <Paragraph>{editingItem.content}</Paragraph>
              </Card>
            </div>
          </div>
        )}
      </Drawer>

      {/* Metadata Standard Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-500" />
            <span>元数据标准详情: {editingItem?.name}</span>
          </div>
        }
        placement="right"
        width={500}
        onClose={() => setMetadataDetailVisible(false)}
        open={metadataDetailVisible}
        destroyOnClose
        extra={
          <Button onClick={() => setMetadataDetailVisible(false)}>关闭</Button>
        }
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setMetadataDetailVisible(false)}>关闭</Button>
          </div>
        }
      >
        {metadataDetailVisible && editingItem && (
          <div className="space-y-6">
            <Descriptions title="基本信息" column={1} bordered size="small">
              <Descriptions.Item label="标准名称">{editingItem.name}</Descriptions.Item>
              <Descriptions.Item label="元数据类型">
                <Tag color="blue">{editingItem.metadataType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="适用业务域">
                <Space size={[0, 8]} wrap>
                  {editingItem.applicableBusinessDomains?.map((domain: string) => (
                    <Tag key={domain}>{domain}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge status={editingItem.status === '生效' ? 'success' : 'error'} text={editingItem.status} />
              </Descriptions.Item>
              <Descriptions.Item label="描述">{editingItem.description}</Descriptions.Item>
            </Descriptions>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Title level={5} style={{ margin: 0 }}>字段定义</Title>
              </div>
              <Table
                dataSource={editingItem.fields || []}
                pagination={false}
                size="small"
                rowKey="id"
                columns={[
                  { title: '字段标识', dataIndex: 'id', key: 'id' },
                  { title: '显示名称', dataIndex: 'displayName', key: 'displayName' },
                  { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
                  { 
                    title: '是否必填', 
                    dataIndex: 'required', 
                    key: 'required',
                    render: (required: boolean) => required ? <Tag color="red">是</Tag> : <Tag>否</Tag>
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Dimension Standard Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Ruler size={20} className="text-blue-500" />
            <span>维度标准详情 - {editingItem?.name}</span>
          </div>
        }
        open={dimensionDetailVisible}
        onCancel={() => setDimensionDetailVisible(false)}
        destroyOnClose
        footer={[<Button key="close" onClick={() => setDimensionDetailVisible(false)}>关闭</Button>]}
        width={700}
      >
        {dimensionDetailVisible && editingItem && (
          <div className="space-y-4">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="标准名称">{editingItem.name}</Descriptions.Item>
              <Descriptions.Item label="维度类型"><Tag>{editingItem.dimensionType}</Tag></Descriptions.Item>
              <Descriptions.Item label="文件大小">{editingItem.fileSizeMb} MB</Descriptions.Item>
              <Descriptions.Item label="适用场景">{editingItem.applicableScenarios}</Descriptions.Item>
              <Descriptions.Item label="创建人">{editingItem.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{editingItem.createTime}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge status={editingItem.status === 'enabled' ? 'success' : 'error'} text={editingItem.status === 'enabled' ? '生效' : '废止'} />
              </Descriptions.Item>
              <Descriptions.Item label="最近更新时间">{editingItem.lastUpdate}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConfigCenter;
