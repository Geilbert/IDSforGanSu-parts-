import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Divider, Drawer, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type PolicyScope = 'low' | 'high';
type LowCategory = '加密策略' | '传输服务管控' | '策略网关';
type HighCategory = '可信环境构建' | '数据预处理' | '数据质量规则' | '容器隔离控制' | '数据销毁策略';
type PolicyCategory = LowCategory | HighCategory;

interface PolicyTemplate {
  key: string;
  category: PolicyCategory;
  name: string;
  status: '启用' | '禁用';
  orderRefCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  summaryA: string;
  summaryB: string;
  description: string;
}

const lowCategories: LowCategory[] = ['加密策略', '传输服务管控', '策略网关'];
const highCategories: HighCategory[] = ['可信环境构建', '数据预处理', '数据质量规则', '容器隔离控制', '数据销毁策略'];

const initialTemplates: PolicyTemplate[] = [
  { key: 'enc_1', category: '加密策略', name: '全局AES-256加密策略', status: '启用', orderRefCount: 8, createdAt: '2026-04-12 09:20', createdBy: '系统管理员', updatedAt: '2026-04-15 10:30', updatedBy: '系统管理员', summaryA: 'AES-256 整体加密', summaryB: '结构化数据', description: '用于需要后续解密的场景：对符合条件的所有字段值进行AES-256加密。' },
  { key: 'enc_2', category: '加密策略', name: '客户隐私字段通用掩码策略', status: '启用', orderRefCount: 5, createdAt: '2026-04-11 14:10', createdBy: '系统管理员', updatedAt: '2026-04-14 15:20', updatedBy: '系统管理员', summaryA: '通用掩码（手机/证件号规则）', summaryB: '文件', description: '系统自动识别类似手机号/证件号字段，并应用标准掩码（如 13812345678 → 138****5678）。' },
  {
    key: 'ctl_1',
    category: '传输服务管控',
    name: '高优先级实时传输策略',
    status: '启用',
    orderRefCount: 6,
    createdAt: '2026-04-10 09:00',
    createdBy: '系统管理员',
    updatedAt: '2026-04-15 09:10',
    updatedBy: '系统管理员',
    summaryA: '高',
    summaryB: '传输内存:8GB; 传输带宽:100Mbps; 重试次数:3次; 超时:30秒; 监控告警:开启',
    description: '适用于实时订单同步场景',
  },
  { key: 'gw_1', category: '策略网关', name: '用户信息安全交付策略', status: '启用', orderRefCount: 10, createdAt: '2026-04-09 10:20', createdBy: '系统管理员', updatedAt: '2026-04-13 17:40', updatedBy: '系统管理员', summaryA: 'app_20260409102001', summaryB: '{"timeoutMs":30000,"signMethod":"hmac-sha256"}', description: '用于用户信息类低密交付，配合实时传输管控策略。' },
  { key: 'gw_2', category: '策略网关', name: '营销素材文件交付策略', status: '启用', orderRefCount: 4, createdAt: '2026-04-09 11:30', createdBy: '系统管理员', updatedAt: '2026-04-14 11:25', updatedBy: '系统管理员', summaryA: 'app_20260409113001', summaryB: '{"maxPayloadMb":100,"retryIntervalSec":10}', description: '用于营销素材文件交付，支持按目录权限控制。' },
  { key: 'tee_1', category: '可信环境构建', name: 'SGX-4C8G计算环境', status: '启用', orderRefCount: 4, createdAt: '2026-04-08 15:40', createdBy: '系统管理员', updatedAt: '2026-04-12 16:40', updatedBy: '系统管理员', summaryA: '4', summaryB: '8', description: '中密计算标准环境模板' },
  { key: 'pre_1', category: '数据预处理', name: '通用手机号掩码规则', status: '启用', orderRefCount: 7, createdAt: '2026-04-10 09:25', createdBy: '系统管理员', updatedAt: '2026-04-15 08:45', updatedBy: '系统管理员', summaryA: '脱敏', summaryB: 'SQL模板', description: '对字段{field}保留前三后四' },
  { key: 'quality_1', category: '数据质量规则', name: '字段非空率检查', status: '启用', orderRefCount: 6, createdAt: '2026-04-10 10:10', createdBy: '系统管理员', updatedAt: '2026-04-15 08:35', updatedBy: '系统管理员', summaryA: '完整性', summaryB: '阈值参数化', description: '检查字段{field}非空率 >= {threshold}%' },
  { key: 'container_1', category: '容器隔离控制', name: '强隔离计算容器', status: '禁用', orderRefCount: 0, createdAt: '2026-04-07 17:20', createdBy: '系统管理员', updatedAt: '2026-04-10 13:20', updatedBy: '系统管理员', summaryA: '单任务隔离', summaryB: '', description: '强隔离中密容器模板' },
  { key: 'destroy_1', category: '数据销毁策略', name: '标准30天自动清理', status: '启用', orderRefCount: 5, createdAt: '2026-04-08 11:10', createdBy: '系统管理员', updatedAt: '2026-04-11 11:30', updatedBy: '系统管理员', summaryA: '自动销毁', summaryB: '30天', description: '任务完成后留存30天并自动销毁' },
];

const defaultTransportConfig = {
  retryCount: 3,
};

function generateAppKey() {
  const seed = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  return `app_${seed}`;
}

function parseTransportConfig(summaryB: string) {
  const fallback = { ...defaultTransportConfig };
  const text = String(summaryB || '');
  if (!text.trim()) return fallback;

  const retry = text.match(/重试次数[:=]?\s*(\d+)\s*次/i);
  const pureNumber = text.match(/^\s*(\d+)\s*$/);

  return {
    retryCount: retry ? Number(retry[1]) : pureNumber ? Number(pureNumber[1]) : fallback.retryCount,
  };
}

function getTransportPriority(summaryA: string) {
  const value = String(summaryA || '').trim();
  if (value === '低' || value === '中' || value === '高') return value;
  return '中';
}

function parseTrustedEnvResources(summaryA: string, summaryB: string) {
  const cpuFromA = String(summaryA || '').match(/^\s*(\d+)\s*$/);
  const memFromB = String(summaryB || '').match(/^\s*(\d+)\s*$/);
  if (cpuFromA && memFromB) {
    return { cpu: Number(cpuFromA[1]), memory: Number(memFromB[1]) };
  }

  const resourceText = `${summaryA || ''} ${summaryB || ''}`;
  const compact = resourceText.match(/(\d+)\s*C\s*\/\s*(\d+)\s*G/i);
  if (compact) {
    return { cpu: Number(compact[1]), memory: Number(compact[2]) };
  }

  const cpu = resourceText.match(/CPU[:=]?\s*(\d+)/i);
  const memory = resourceText.match(/内存[:=]?\s*(\d+)\s*G?B?/i);
  return {
    cpu: cpu ? Number(cpu[1]) : 4,
    memory: memory ? Number(memory[1]) : 8,
  };
}

const DeliveryPolicyCenter: React.FC = () => {
  const [activeScope, setActiveScope] = useState<PolicyScope>('low');
  const [activeCategory, setActiveCategory] = useState<PolicyCategory>('加密策略');
  const [keyword, setKeyword] = useState('');
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<PolicyTemplate[]>(initialTemplates);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<PolicyTemplate | null>(null);
  const [detailRecord, setDetailRecord] = useState<PolicyTemplate | null>(null);
  const [usageFlowVisible, setUsageFlowVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = activeScope === 'low' ? lowCategories : highCategories;

  const filteredRows = useMemo(() => {
    return templates
      .filter((item) => item.category === activeCategory)
      .filter((item) => `${item.name}${item.summaryA}${item.summaryB}`.toLowerCase().includes(keyword.toLowerCase()));
  }, [templates, activeCategory, keyword]);

  const openCreate = () => {
    setModalType('add');
    setEditingRecord(null);
    form.resetFields();
    if (activeCategory === '加密策略') {
      form.setFieldsValue({
        encryptionMethod: 'AES-256 整体加密',
        encryptionType: '结构化数据',
        status: true,
      });
    } else if (activeCategory === '传输服务管控') {
      form.setFieldsValue({
        summaryA: '中',
        retryCount: defaultTransportConfig.retryCount,
      });
    } else if (activeCategory === '策略网关') {
      form.setFieldsValue({
        appKey: generateAppKey(),
      });
    } else if (activeCategory === '容器隔离控制') {
      form.setFieldsValue({
        summaryA: '单任务隔离',
      });
    } else if (activeCategory === '数据销毁策略') {
      form.setFieldsValue({
        destroyMode: '自动销毁',
      });
    }
    setModalVisible(true);
  };

  const openEdit = (record: PolicyTemplate) => {
    setModalType('edit');
    setEditingRecord(record);
    if (activeCategory === '加密策略') {
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        encryptionMethod: record.summaryA,
        encryptionType: record.summaryB || '结构化数据',
        status: record.status === '启用',
      });
    } else if (activeCategory === '传输服务管控') {
      const parsed = parseTransportConfig(record.summaryB);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        summaryA: record.summaryA,
        retryCount: parsed.retryCount,
      });
    } else if (activeCategory === '可信环境构建') {
      const parsed = parseTrustedEnvResources(record.summaryA, record.summaryB);
      form.setFieldsValue({
        name: record.name,
        cpu: parsed.cpu,
        memory: parsed.memory,
        description: record.description,
      });
    } else if (activeCategory === '数据销毁策略') {
      form.setFieldsValue({
        name: record.name,
        destroyMode: record.summaryA || '自动销毁',
        destroyTime: record.summaryA === '自动销毁' ? record.summaryB : undefined,
        description: record.description,
      });
    } else if (activeCategory === '策略网关') {
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        appKey: record.summaryA,
        gatewayParams: record.summaryB,
      });
    } else {
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        summaryA: record.summaryA,
        summaryB: record.summaryB,
      });
    }
    setModalVisible(true);
  };

  const submit = async () => {
    if (submitting) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Simulate backend latency so button text + disable behavior is visible.
      await new Promise((resolve) => setTimeout(resolve, 700));

      if (activeCategory === '加密策略') {
        const name = String(values.name || '').trim();
        const status = values.status ? '启用' : '禁用';
        const encryptionMethod = String(values.encryptionMethod || '');
        const encryptionType = String(values.encryptionType || '结构化数据');

        const conflict = templates.some(
          (t) => t.category === '加密策略' && t.name.trim() === name && t.key !== editingRecord?.key,
        );
        if (conflict) {
          form.setFields([{ name: 'name', errors: ['策略名称已存在'] }]);
          message.error('策略名称已存在');
          return;
        }

        if (modalType === 'add') {
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name,
            status,
            orderRefCount: 0,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            createdBy: '当前用户',
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            updatedBy: '当前用户',
            summaryA: encryptionMethod,
            summaryB: encryptionType,
            description: values.description || '',
          };
          setTemplates((prev) => [newItem, ...prev]);
          message.success(`加密策略‘${name}’创建成功`);
          setModalVisible(false);
          return;
        }

        if (modalType === 'edit' && editingRecord) {
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name,
                    status,
                    summaryA: encryptionMethod,
                    summaryB: encryptionType,
                    description: values.description || '',
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    updatedBy: '当前用户',
                  }
                : item,
            ),
          );
          message.success(`加密策略‘${name}’更新成功`);
          setModalVisible(false);
          return;
        }
      }

      if (activeCategory === '策略网关') {
        const name = String(values.name || '').trim();
        const appKey = modalType === 'edit' && editingRecord ? editingRecord.summaryA : String(values.appKey || '').trim();
        const gatewayParams = String(values.gatewayParams || '').trim();
        if (modalType === 'add') {
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name,
            status: '启用',
            orderRefCount: 0,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            createdBy: '当前用户',
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            updatedBy: '当前用户',
            summaryA: appKey || generateAppKey(),
            summaryB: gatewayParams,
            description: values.description || '',
          };
          setTemplates((prev) => [newItem, ...prev]);
          message.success('策略模板创建成功');
          setModalVisible(false);
          return;
        }
        if (editingRecord) {
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name,
                    summaryA: editingRecord.summaryA,
                    summaryB: gatewayParams,
                    description: values.description || '',
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    updatedBy: '当前用户',
                  }
                : item,
            ),
          );
          message.success('策略模板更新成功');
          setModalVisible(false);
          return;
        }
      }

      if (activeCategory === '可信环境构建') {
        const name = String(values.name || '').trim();
        const cpu = Number(values.cpu);
        const memory = Number(values.memory);
        if (modalType === 'add') {
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name,
            status: '启用',
            orderRefCount: 0,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            createdBy: '当前用户',
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            updatedBy: '当前用户',
            summaryA: String(cpu),
            summaryB: String(memory),
            description: values.description || '',
          };
          setTemplates((prev) => [newItem, ...prev]);
          message.success('策略模板创建成功');
          setModalVisible(false);
          return;
        }
        if (editingRecord) {
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name,
                    summaryA: String(cpu),
                    summaryB: String(memory),
                    description: values.description || '',
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    updatedBy: '当前用户',
                  }
                : item,
            ),
          );
          message.success('策略模板更新成功');
          setModalVisible(false);
          return;
        }
      }

      if (activeCategory === '数据销毁策略') {
        const name = String(values.name || '').trim();
        const destroyMode = String(values.destroyMode || '自动销毁');
        const destroyTime = destroyMode === '自动销毁' ? String(values.destroyTime || '').trim() : '';
        if (modalType === 'add') {
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name,
            status: '启用',
            orderRefCount: 0,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            createdBy: '当前用户',
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            updatedBy: '当前用户',
            summaryA: destroyMode,
            summaryB: destroyTime,
            description: values.description || '',
          };
          setTemplates((prev) => [newItem, ...prev]);
          message.success('策略模板创建成功');
          setModalVisible(false);
          return;
        }
        if (editingRecord) {
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name,
                    summaryA: destroyMode,
                    summaryB: destroyTime,
                    description: values.description || '',
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    updatedBy: '当前用户',
                  }
                : item,
            ),
          );
          message.success('策略模板更新成功');
          setModalVisible(false);
          return;
        }
      }

      // Other categories keep existing behavior (no status field in their forms).
      if (modalType === 'add') {
        if (activeCategory === '传输服务管控') {
          const configSummary = `重试次数:${Number(values.retryCount)}次`;
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name: values.name,
            status: '启用',
            orderRefCount: 0,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            createdBy: '当前用户',
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            updatedBy: '当前用户',
            summaryA: values.summaryA,
            summaryB: configSummary,
            description: values.description || '',
          };
          setTemplates((prev) => [newItem, ...prev]);
          message.success('策略模板创建成功');
          setModalVisible(false);
          return;
        }

        const newItem: PolicyTemplate = {
          key: `${activeCategory}_${Date.now()}`,
          category: activeCategory,
          name: values.name,
          status: '启用',
          orderRefCount: 0,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
          createdBy: '当前用户',
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
          updatedBy: '当前用户',
          summaryA: values.summaryA,
          summaryB: values.summaryB,
          description: values.description || '',
        };
        setTemplates((prev) => [newItem, ...prev]);
        message.success('策略模板创建成功');
        setModalVisible(false);
      } else if (editingRecord) {
        if (activeCategory === '传输服务管控') {
          const configSummary = `重试次数:${Number(values.retryCount)}次`;
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name: values.name,
                    summaryA: values.summaryA,
                    summaryB: configSummary,
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                    updatedBy: '当前用户',
                  }
                : item,
            ),
          );
          message.success('策略模板更新成功');
          setModalVisible(false);
          return;
        }

        setTemplates((prev) =>
          prev.map((item) =>
            item.key === editingRecord.key
              ? { ...item, ...values, updatedAt: dayjs().format('YYYY-MM-DD HH:mm'), updatedBy: '当前用户' }
              : item,
          ),
        );
        message.success('策略模板更新成功');
        setModalVisible(false);
      }
    } catch (e) {
      // validateFields failure is handled by antd Form; conflict errors are handled above.
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = (record: PolicyTemplate) => {
    setTemplates((prev) =>
      prev.map((item) =>
        item.key === record.key ? { ...item, status: item.status === '启用' ? '禁用' : '启用' } : item,
      ),
    );
    message.success(`${record.status === '启用' ? '禁用' : '启用'}成功`);
  };

  const removeTemplate = (record: PolicyTemplate) => {
    if (record.orderRefCount > 0) {
      message.error('该策略模板已被订单引用，无法删除');
      return;
    }
    Modal.confirm({
      title: '确认删除策略模板',
      content: `确定要删除“${record.name}”吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setTemplates((prev) => prev.filter((item) => item.key !== record.key));
        message.success('删除成功');
      },
    });
  };

  const getColumns = (): ColumnsType<PolicyTemplate> => {
    if (activeCategory === '加密策略') {
      return [
        { title: '策略名称', dataIndex: 'name' },
        { title: '加密类型', dataIndex: 'summaryB' },
        { title: '加密/处理方法', dataIndex: 'summaryA' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '传输服务管控') {
      return [
        { title: '策略名称', dataIndex: 'name' },
        {
          title: '重试次数',
          dataIndex: 'summaryB',
          render: (v: string) => parseTransportConfig(v).retryCount,
        },
        {
          title: '传输优先级',
          dataIndex: 'summaryA',
          render: (v: string) => getTransportPriority(v),
        },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '策略网关') {
      return [
        { title: '策略名称', dataIndex: 'name' },
        { title: 'appkey', dataIndex: 'summaryA' },
        { title: '网关参数', dataIndex: 'summaryB' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '容器隔离控制') {
      return [
        { title: '隔离策略名称', dataIndex: 'name' },
        { title: '隔离方式', dataIndex: 'summaryA' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '数据销毁策略') {
      return [
        { title: '策略名称', dataIndex: 'name' },
        { title: '销毁方式', dataIndex: 'summaryA' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '可信环境构建') {
      return [
        { title: '可信环境名称', dataIndex: 'name' },
        { title: '内存', dataIndex: 'summaryB', render: (v: string) => `${v} GB` },
        { title: 'CPU', dataIndex: 'summaryA', render: (v: string) => `${v} 核` },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    return [
      { title: '模板名称', dataIndex: 'name' },
      { title: '关键类型', dataIndex: 'summaryA' },
      { title: '配置摘要', dataIndex: 'summaryB' },
      { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
      { title: '操作', render: (_, row) => renderActions(row) },
    ];
  };

  const renderActions = (row: PolicyTemplate) => (
    <Space>
      <Button type="link" onClick={() => openEdit(row)}>编辑</Button>
      <Button type="link" onClick={() => setDetailRecord(row)}>详情</Button>
      <Button type="link" onClick={() => toggleStatus(row)}>{row.status === '启用' ? '禁用' : '启用'}</Button>
      <Button type="link" danger onClick={() => removeTemplate(row)}>删除</Button>
    </Space>
  );

  const renderCategoryForm = () => {
    if (activeCategory === '加密策略') {
      return (
        <>
          <Form.Item
            name="name"
            label="策略名称"
            rules={[
              { required: true, message: '请输入策略名称' },
              {
                validator: async (_, value) => {
                  const v = String(value || '').trim();
                  if (!v) return Promise.resolve();
                  const conflict = templates.some(
                    (t) => t.category === '加密策略' && t.name.trim() === v && t.key !== editingRecord?.key,
                  );
                  if (conflict) return Promise.reject(new Error('策略名称已存在'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="如：全局AES-256加密策略" />
          </Form.Item>

          <Form.Item
            name="encryptionType"
            label="加密类型"
            rules={[{ required: true, message: '请选择加密类型' }]}
          >
            <Select
              options={[
                { label: '文件', value: '文件' },
                { label: '结构化数据', value: '结构化数据' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="encryptionMethod"
            label="加密/处理方法"
            rules={[{ required: true, message: '请选择加密/处理方法' }]}
          >
            <Select
              options={[
                { label: 'AES-256 整体加密', value: 'AES-256 整体加密' },
                { label: '通用掩码（手机/证件号规则）', value: '通用掩码（手机/证件号规则）' },
                { label: '固定字符遮盖', value: '固定字符遮盖' },
                { label: '哈希脱敏 (SHA-256)', value: '哈希脱敏 (SHA-256)' },
              ]}
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={2}
              placeholder="（选填）本策略将对所有输出字段进行强加密，适用于向外部合作方交付核心业务数据。"
            />
          </Form.Item>

          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </>
      );
    }
    if (activeCategory === '传输服务管控') {
      return (
        <>
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}><Input placeholder="如：夜间批处理策略" /></Form.Item>
          <Form.Item name="summaryA" label="传输优先级" rules={[{ required: true, message: '请选择传输优先级' }]}><Select options={['低', '中', '高'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item
            name="retryCount"
            label="容错与重试-重试次数"
            rules={[{ required: true, message: '请输入重试次数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：3" />
          </Form.Item>
        </>
      );
    }
    if (activeCategory === '策略网关') {
      return (
        <>
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}><Input placeholder="如：用户信息安全交付策略" /></Form.Item>
          <Form.Item name="appKey" label="appkey" rules={[{ required: true, message: '系统未生成appkey，请重试' }]}>
            <Input disabled placeholder="系统自动生成，不可修改" />
          </Form.Item>
          <Form.Item name="gatewayParams" label="网关参数" rules={[{ required: true, message: '请输入网关参数' }]}>
            <Input.TextArea rows={2} placeholder="请输入网关参数（如JSON或键值对）" />
          </Form.Item>
          <Form.Item name="description" label="策略描述"><Input.TextArea rows={2} placeholder="说明该低密交付策略的业务用途" /></Form.Item>
        </>
      );
    }
    if (activeCategory === '可信环境构建') {
      return (
        <>
          <Form.Item name="name" label="可信环境名称" rules={[{ required: true, message: '请输入可信环境名称' }]}><Input placeholder="如：SGX-4C8G计算环境" /></Form.Item>
          <Form.Item name="memory" label="内存(GB)" rules={[{ required: true, message: '请输入内存' }]}><InputNumber min={1} style={{ width: '100%' }} placeholder="如：8" /></Form.Item>
          <Form.Item name="cpu" label="CPU(核)" rules={[{ required: true, message: '请输入CPU核数' }]}><InputNumber min={1} style={{ width: '100%' }} placeholder="如：4" /></Form.Item>
          <Form.Item name="description" label="环境说明"><Input.TextArea rows={2} placeholder="说明可信环境用途与适用场景" /></Form.Item>
        </>
      );
    }
    if (activeCategory === '数据预处理') {
      return (
        <>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}><Input placeholder="如：通用手机号掩码规则" /></Form.Item>
          <Form.Item name="summaryA" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}><Select options={['脱敏', '转换', '过滤', '聚合'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item name="summaryB" label="规则逻辑" rules={[{ required: true, message: '请输入规则逻辑摘要' }]}><Input placeholder="如：对字段{field}保留前三后四" /></Form.Item>
          <Form.Item label="逻辑编辑器"><Input.TextArea rows={3} placeholder="支持SQL或Python UDF片段" /></Form.Item>
        </>
      );
    }
    if (activeCategory === '数据质量规则') {
      return (
        <>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}><Input placeholder="如：字段非空率检查" /></Form.Item>
          <Form.Item name="summaryA" label="校验维度" rules={[{ required: true, message: '请选择校验维度' }]}><Select options={['完整性', '准确性', '唯一性', '一致性', '及时性'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item name="summaryB" label="规则逻辑" rules={[{ required: true, message: '请输入规则逻辑摘要' }]}><Input placeholder="如：字段{field}非空率 >= {threshold}%" /></Form.Item>
        </>
      );
    }
    if (activeCategory === '容器隔离控制') {
      return (
        <>
          <Form.Item name="name" label="隔离策略名称" rules={[{ required: true, message: '请输入隔离策略名称' }]}><Input placeholder="如：强隔离计算容器" /></Form.Item>
          <Form.Item name="summaryA" label="隔离方式" rules={[{ required: true, message: '请选择隔离方式' }]}><Select options={['单任务隔离', '并行任务'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item name="description" label="策略说明"><Input.TextArea rows={2} placeholder="说明该隔离策略的适用场景" /></Form.Item>
        </>
      );
    }
    return (
      <>
        <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}><Input placeholder="如：标准30天自动清理" /></Form.Item>
        <Form.Item name="destroyMode" label="销毁方式" rules={[{ required: true, message: '请选择销毁方式' }]}>
          <Select options={['自动销毁', '手动销毁'].map((x) => ({ label: x, value: x }))} />
        </Form.Item>
        <Form.Item shouldUpdate={(prev, cur) => prev.destroyMode !== cur.destroyMode} noStyle>
          {({ getFieldValue }) => (
            getFieldValue('destroyMode') === '自动销毁' ? (
              <Form.Item name="destroyTime" label="销毁时间（选填）">
                <Input placeholder="如：30天后 / 2026-05-01 00:00" />
              </Form.Item>
            ) : null
          )}
        </Form.Item>
        <Form.Item name="description" label="策略说明"><Input.TextArea rows={2} placeholder="说明销毁策略适用场景" /></Form.Item>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>交付策略</Title>
      <Text type="secondary">安全能力模板库：在此定义抽象、可复用的低密/中密能力模板，订单创建时再进行字段绑定和参数装配。</Text>

      <Card size="small">
        <Tabs
          activeKey={activeScope}
          onChange={(k) => {
            const next = k as PolicyScope;
            setActiveScope(next);
            setActiveCategory(next === 'low' ? '加密策略' : '可信环境构建');
          }}
          items={[
            { key: 'low', label: '低密交付策略' },
            { key: 'high', label: '中密交付策略' },
          ]}
        />

        <Row gutter={16}>
          <Col span={5}>
            <Card size="small" title="策略分类">
              <Space direction="vertical" style={{ width: '100%' }}>
                {categories.map((item) => (
                  <Button key={item} type={activeCategory === item ? 'primary' : 'default'} block onClick={() => setActiveCategory(item)}>
                    {item}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>

          <Col span={19}>
            <Card
              size="small"
              title={`${activeCategory}模板列表`}
              extra={
                <Space>
                  <Input placeholder="搜索模板名称/关键字" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} />
                  <Button onClick={() => setUsageFlowVisible(true)}>能力装配说明</Button>
                  <Button type="primary" onClick={openCreate}>创建模板</Button>
                </Space>
              }
            >
              <Table rowKey="key" dataSource={filteredRows} columns={getColumns()} pagination={{ pageSize: 8 }} />
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        open={modalVisible}
        title={modalType === 'add' ? `创建${activeCategory}` : `编辑${activeCategory}`}
        width={720}
        onCancel={() => {
          if (submitting) return;
          setModalVisible(false);
        }}
        footer={
          <Space>
            <Button onClick={() => setModalVisible(false)} disabled={submitting}>取消</Button>
            <Button
              type="primary"
              onClick={() => void submit()}
              loading={submitting}
              disabled={submitting}
            >
              {modalType === 'add'
                ? activeCategory === '加密策略'
                  ? submitting
                    ? '提交中...'
                    : '提交'
                  : submitting
                    ? '保存中...'
                    : '保存'
                : submitting
                  ? '保存中...'
                  : '保存'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="mt-3">
          {renderCategoryForm()}
          <Text type="secondary">说明：模板仅定义能力，不绑定具体数据字段。字段映射在交付订单创建时完成。</Text>
        </Form>
      </Modal>

      <Drawer
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        width={680}
        title={`策略详情：${detailRecord?.name || ''}`}
      >
        {detailRecord && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              {detailRecord.category !== '传输服务管控' && (
                <Descriptions.Item label="模板分类">{detailRecord.category}</Descriptions.Item>
              )}
              {detailRecord.category !== '可信环境构建' && (
                <Descriptions.Item label="模板名称">{detailRecord.name}</Descriptions.Item>
              )}
              {detailRecord.category === '加密策略' ? (
                <>
                  <Descriptions.Item label="加密类型">{detailRecord.summaryB || '-'}</Descriptions.Item>
                  <Descriptions.Item label="加密/处理方法">{detailRecord.summaryA}</Descriptions.Item>
                </>
              ) : detailRecord.category === '传输服务管控' ? (
                <>
                  <Descriptions.Item label="传输优先级">{getTransportPriority(detailRecord.summaryA)}</Descriptions.Item>
                  <Descriptions.Item label="重试次数">{parseTransportConfig(detailRecord.summaryB).retryCount}次</Descriptions.Item>
                </>
              ) : detailRecord.category === '策略网关' ? (
                <>
                  <Descriptions.Item label="appkey">{detailRecord.summaryA || '-'}</Descriptions.Item>
                  <Descriptions.Item label="网关参数">{detailRecord.summaryB || '-'}</Descriptions.Item>
                </>
              ) : detailRecord.category === '可信环境构建' ? (
                <>
                  <Descriptions.Item label="可信环境名称">{detailRecord.name}</Descriptions.Item>
                  <Descriptions.Item label="内存">{detailRecord.summaryB ? `${detailRecord.summaryB} GB` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="CPU">{detailRecord.summaryA ? `${detailRecord.summaryA} 核` : '-'}</Descriptions.Item>
                </>
              ) : detailRecord.category === '容器隔离控制' ? (
                <>
                  <Descriptions.Item label="隔离策略名称">{detailRecord.name}</Descriptions.Item>
                  <Descriptions.Item label="隔离方式">{detailRecord.summaryA || '-'}</Descriptions.Item>
                </>
              ) : detailRecord.category === '数据销毁策略' ? (
                <>
                  <Descriptions.Item label="策略名称">{detailRecord.name}</Descriptions.Item>
                  <Descriptions.Item label="销毁方式">{detailRecord.summaryA || '-'}</Descriptions.Item>
                  {detailRecord.summaryA === '自动销毁' && (
                    <Descriptions.Item label="销毁时间">{detailRecord.summaryB || '-'}</Descriptions.Item>
                  )}
                </>
              ) : (
                <>
                  <Descriptions.Item label="关键参数1">{detailRecord.summaryA}</Descriptions.Item>
                  <Descriptions.Item label="关键参数2">{detailRecord.summaryB}</Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="状态">
                <Tag color={detailRecord.status === '启用' ? 'green' : 'default'}>{detailRecord.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="引用订单">{detailRecord.orderRefCount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailRecord.createdAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{detailRecord.createdBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detailRecord.updatedAt}</Descriptions.Item>
              <Descriptions.Item label="更新人">{detailRecord.updatedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="描述">{detailRecord.description || '-'}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="能力与业务装配关系">
              <Text type="secondary">安全能力模板（本页定义） → 订单创建步骤二（绑定字段与填入参数） → 生成可执行任务实例</Text>
            </Card>
          </div>
        )}
      </Drawer>

      <Drawer
        open={usageFlowVisible}
        onClose={() => setUsageFlowVisible(false)}
        width={640}
        title="策略如何在订单中被使用"
      >
        <div className="space-y-3">
          <Card size="small" title="1. 能力定义">
            在交付策略页面创建能力模板（例如：AES加密策略、手机号脱敏规则、质量规则模板）。
          </Card>
          <Card size="small" title="2. 订单装配">
            在交付订单步骤二选择策略网关/中密规则时，系统触发字段绑定与参数填入界面，将抽象模板映射到具体字段。
          </Card>
          <Card size="small" title="3. 策略执行">
            订单执行时系统注入字段与参数，生成具体任务实例并按模板定义执行。
          </Card>
          <Divider />
          <Text type="secondary">该流程实现“能力定义”与“业务应用”解耦，保证模板合规与业务灵活并存。</Text>
        </div>
      </Drawer>
    </div>
  );
};

export default DeliveryPolicyCenter;

