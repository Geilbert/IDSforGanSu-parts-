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
  updatedAt: string;
  summaryA: string;
  summaryB: string;
  description: string;
}

const lowCategories: LowCategory[] = ['加密策略', '传输服务管控', '策略网关'];
const highCategories: HighCategory[] = ['可信环境构建', '数据预处理', '数据质量规则', '容器隔离控制', '数据销毁策略'];

const initialTemplates: PolicyTemplate[] = [
  { key: 'enc_1', category: '加密策略', name: '全局AES-256加密策略', status: '启用', orderRefCount: 8, updatedAt: '2026-04-15 10:30', summaryA: 'AES-256 整体加密', summaryB: '', description: '用于需要后续解密的场景：对符合条件的所有字段值进行AES-256加密。' },
  { key: 'enc_2', category: '加密策略', name: '客户隐私字段通用掩码策略', status: '启用', orderRefCount: 5, updatedAt: '2026-04-14 15:20', summaryA: '通用掩码（手机/证件号规则）', summaryB: '', description: '系统自动识别类似手机号/证件号字段，并应用标准掩码（如 13812345678 → 138****5678）。' },
  {
    key: 'ctl_1',
    category: '传输服务管控',
    name: '高优先级实时传输策略',
    status: '启用',
    orderRefCount: 6,
    updatedAt: '2026-04-15 09:10',
    summaryA: '立即执行',
    summaryB: '传输内存:8GB; 传输带宽:100Mbps; 重试次数:3次; 超时:30秒; 监控告警:开启',
    description: '适用于实时订单同步场景',
  },
  { key: 'gw_1', category: '策略网关', name: '用户信息SFTP安全传输网关', status: '启用', orderRefCount: 10, updatedAt: '2026-04-13 17:40', summaryA: 'SFTP', summaryB: 'AES-256-GCM基础加密包 + 高优先级实时传输策略', description: '用于用户信息文件类低密交付' },
  { key: 'tee_1', category: '可信环境构建', name: 'SGX-4C8G计算环境', status: '启用', orderRefCount: 4, updatedAt: '2026-04-12 16:40', summaryA: 'Intel SGX', summaryB: '4C/8G', description: '中密计算标准环境模板' },
  { key: 'pre_1', category: '数据预处理', name: '通用手机号掩码规则', status: '启用', orderRefCount: 7, updatedAt: '2026-04-15 08:45', summaryA: '脱敏', summaryB: 'SQL模板', description: '对字段{field}保留前三后四' },
  { key: 'quality_1', category: '数据质量规则', name: '字段非空率检查', status: '启用', orderRefCount: 6, updatedAt: '2026-04-15 08:35', summaryA: '完整性', summaryB: '阈值参数化', description: '检查字段{field}非空率 >= {threshold}%' },
  { key: 'container_1', category: '容器隔离控制', name: '强隔离计算容器', status: '禁用', orderRefCount: 0, updatedAt: '2026-04-10 13:20', summaryA: '8C/16G', summaryB: '禁止所有出入站', description: '强隔离中密容器模板' },
  { key: 'destroy_1', category: '数据销毁策略', name: '标准30天自动清理', status: '启用', orderRefCount: 5, updatedAt: '2026-04-11 11:30', summaryA: '时间触发', summaryB: '高强度擦除3次覆写', description: '任务完成后留存30天并自动销毁' },
];

const defaultTransportConfig = {
  transferMemory: 8,
  transferBandwidth: 100,
  retryCount: 3,
  retryTimeoutSec: 30,
  monitorAlertEnabled: true,
};

function parseTransportConfig(summaryB: string) {
  const fallback = { ...defaultTransportConfig };
  const text = String(summaryB || '');
  if (!text.trim()) return fallback;

  const mem = text.match(/内存[:=]?\s*(\d+)\s*GB/i);
  const bw = text.match(/带宽[:=]?\s*(\d+)\s*Mbps/i);
  const retry = text.match(/重试次数[:=]?\s*(\d+)\s*次/i);
  const timeout = text.match(/超时[:=]?\s*(\d+)\s*秒/i);
  const monitor = text.match(/监控告警[:=]?\s*(开启|关闭)/i);

  return {
    transferMemory: mem ? Number(mem[1]) : fallback.transferMemory,
    transferBandwidth: bw ? Number(bw[1]) : fallback.transferBandwidth,
    retryCount: retry ? Number(retry[1]) : fallback.retryCount,
    retryTimeoutSec: timeout ? Number(timeout[1]) : fallback.retryTimeoutSec,
    monitorAlertEnabled: monitor ? String(monitor[1]) === '开启' : fallback.monitorAlertEnabled,
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
        status: true,
      });
    } else if (activeCategory === '传输服务管控') {
      form.setFieldsValue({
        transferMemory: defaultTransportConfig.transferMemory,
        transferBandwidth: defaultTransportConfig.transferBandwidth,
        retryCount: defaultTransportConfig.retryCount,
        retryTimeoutSec: defaultTransportConfig.retryTimeoutSec,
        monitorAlertEnabled: defaultTransportConfig.monitorAlertEnabled,
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
        status: record.status === '启用',
      });
    } else if (activeCategory === '传输服务管控') {
      const parsed = parseTransportConfig(record.summaryB);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        summaryA: record.summaryA,
        transferMemory: parsed.transferMemory,
        transferBandwidth: parsed.transferBandwidth,
        retryCount: parsed.retryCount,
        retryTimeoutSec: parsed.retryTimeoutSec,
        monitorAlertEnabled: parsed.monitorAlertEnabled,
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
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            summaryA: encryptionMethod,
            summaryB: '',
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
                    summaryB: '',
                    description: values.description || '',
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
                  }
                : item,
            ),
          );
          message.success(`加密策略‘${name}’更新成功`);
          setModalVisible(false);
          return;
        }
      }

      // Other categories keep existing behavior (no status field in their forms).
      if (modalType === 'add') {
        if (activeCategory === '传输服务管控') {
          const configSummary = `传输内存:${Number(values.transferMemory)}GB; 传输带宽:${Number(values.transferBandwidth)}Mbps; 重试次数:${Number(values.retryCount)}次; 超时:${Number(values.retryTimeoutSec)}秒; 监控告警:${values.monitorAlertEnabled ? '开启' : '关闭'}`;
          const newItem: PolicyTemplate = {
            key: `${activeCategory}_${Date.now()}`,
            category: activeCategory,
            name: values.name,
            status: '启用',
            orderRefCount: 0,
            updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
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
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
          summaryA: values.summaryA,
          summaryB: values.summaryB,
          description: values.description || '',
        };
        setTemplates((prev) => [newItem, ...prev]);
        message.success('策略模板创建成功');
        setModalVisible(false);
      } else if (editingRecord) {
        if (activeCategory === '传输服务管控') {
          const configSummary = `传输内存:${Number(values.transferMemory)}GB; 传输带宽:${Number(values.transferBandwidth)}Mbps; 重试次数:${Number(values.retryCount)}次; 超时:${Number(values.retryTimeoutSec)}秒; 监控告警:${values.monitorAlertEnabled ? '开启' : '关闭'}`;
          setTemplates((prev) =>
            prev.map((item) =>
              item.key === editingRecord.key
                ? {
                    ...item,
                    name: values.name,
                    summaryA: values.summaryA,
                    summaryB: configSummary,
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
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
              ? { ...item, ...values, updatedAt: dayjs().format('YYYY-MM-DD HH:mm') }
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
        { title: '加密/处理方法', dataIndex: 'summaryA' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '传输服务管控') {
      return [
        { title: '策略名称', dataIndex: 'name' },
        { title: '调度类型', dataIndex: 'summaryA' },
        { title: '传输配置', dataIndex: 'summaryB' },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag> },
        { title: '操作', render: (_, row) => renderActions(row) },
      ];
    }
    if (activeCategory === '策略网关') {
      return [
        { title: '网关名称', dataIndex: 'name' },
        { title: '传输类型', dataIndex: 'summaryA' },
        { title: '关联策略', dataIndex: 'summaryB' },
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
          <Form.Item name="summaryA" label="调度类型" rules={[{ required: true, message: '请选择调度类型' }]}><Select options={['立即执行', '定时执行', '周期执行'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item
            name="transferMemory"
            label="资源配额-传输内存（GB）"
            rules={[{ required: true, message: '请输入传输内存' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="如：8" />
          </Form.Item>
          <Form.Item
            name="transferBandwidth"
            label="资源配额-传输带宽（Mbps）"
            rules={[{ required: true, message: '请输入传输带宽' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="如：100" />
          </Form.Item>
          <Form.Item
            name="retryCount"
            label="容错与重试-重试次数"
            rules={[{ required: true, message: '请输入重试次数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：3" />
          </Form.Item>
          <Form.Item
            name="retryTimeoutSec"
            label="容错与重试-超时时间（秒）"
            rules={[{ required: true, message: '请输入超时时间（秒）' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="如：30" />
          </Form.Item>
          <Form.Item
            name="monitorAlertEnabled"
            label="监控告警"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </>
      );
    }
    if (activeCategory === '策略网关') {
      return (
        <>
          <Form.Item name="name" label="网关名称" rules={[{ required: true, message: '请输入网关名称' }]}><Input placeholder="如：用户信息SFTP安全传输网关" /></Form.Item>
          <Form.Item name="summaryA" label="传输类型" rules={[{ required: true, message: '请选择传输类型' }]}><Select options={['SFTP', '数据库JDBC'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item name="summaryB" label="关联能力包" rules={[{ required: true, message: '请输入关联能力包' }]}><Input placeholder="如：SM4国密加密包 + 高优先级实时传输策略" /></Form.Item>
          <Form.Item label="基础传输模板"><Input.TextArea rows={3} placeholder="根据传输类型配置服务器、端口、路径或连接串等信息" /></Form.Item>
          <Form.Item name="description" label="网关描述"><Input.TextArea rows={2} placeholder="说明网关业务用途" /></Form.Item>
        </>
      );
    }
    if (activeCategory === '可信环境构建') {
      return (
        <>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}><Input placeholder="如：SGX-4C8G计算环境" /></Form.Item>
          <Form.Item name="summaryA" label="环境类型" rules={[{ required: true, message: '请选择环境类型' }]}><Select options={['Intel SGX', 'AMD SEV', '国产TEE芯片'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item name="summaryB" label="资源规格" rules={[{ required: true, message: '请输入资源规格' }]}><Input placeholder="如：4C/8G" /></Form.Item>
          <Form.Item label="基础镜像/证明要求"><Input.TextArea rows={2} placeholder="配置远程证明标准和基础镜像" /></Form.Item>
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
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}><Input placeholder="如：强隔离计算容器" /></Form.Item>
          <Form.Item name="summaryA" label="资源限额" rules={[{ required: true, message: '请输入资源限额' }]}><Input placeholder="如：8C/16G" /></Form.Item>
          <Form.Item name="summaryB" label="网络隔离策略" rules={[{ required: true, message: '请选择网络隔离策略' }]}><Select options={['禁止所有出/入站', '允许访问特定服务'].map((x) => ({ label: x, value: x }))} /></Form.Item>
          <Form.Item label="文件系统访问控制"><Input.TextArea rows={2} placeholder="定义容器可访问目录" /></Form.Item>
        </>
      );
    }
    return (
      <>
        <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}><Input placeholder="如：标准30天自动清理" /></Form.Item>
        <Form.Item name="summaryA" label="触发条件" rules={[{ required: true, message: '请选择触发条件' }]}><Select options={['时间触发', '任务成功触发', '手动触发'].map((x) => ({ label: x, value: x }))} /></Form.Item>
        <Form.Item name="summaryB" label="销毁算法" rules={[{ required: true, message: '请选择销毁算法' }]}><Select options={['安全删除1次覆写', '高强度擦除3次覆写'].map((x) => ({ label: x, value: x }))} /></Form.Item>
        <Form.Item label="留存周期"><Input placeholder="如：30天（时间触发时填写）" /></Form.Item>
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
              <Descriptions.Item label="模板分类">{detailRecord.category}</Descriptions.Item>
              <Descriptions.Item label="模板名称">{detailRecord.name}</Descriptions.Item>
              {detailRecord.category === '加密策略' ? (
                <Descriptions.Item label="加密/处理方法">{detailRecord.summaryA}</Descriptions.Item>
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
              <Descriptions.Item label="更新时间">{detailRecord.updatedAt}</Descriptions.Item>
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

