import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  TreeSelect,
  Typography,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const treeData = [
  {
    title: '公共数据集空间',
    value: 'space-public',
    children: [
      { title: 'User_Transaction_Records', value: 'asset-utr' },
      { title: 'Global_Product_Catalog', value: 'asset-gpc' },
    ],
  },
  {
    title: '营销运营中心',
    value: 'space-market',
    children: [{ title: 'Customer_Profile_Master', value: 'asset-cpm' }],
  },
];

type DeliverySecurityLevel = 'low' | 'high';
type LevelAction = { type: 'SET_LEVEL'; level: DeliverySecurityLevel };
interface MaskRow {
  key: string;
  field: string;
  algorithm: 'SHA-256' | '随机掩码' | '对称加密';
}

function levelReducer(_: DeliverySecurityLevel, action: LevelAction): DeliverySecurityLevel {
  if (action.type === 'SET_LEVEL') return action.level;
  return 'low';
}

const DeliveryPolicyWizard: React.FC = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [deliveryLevel, dispatchLevel] = useReducer(levelReducer, 'low');
  const deliveryMode = Form.useWatch('deliveryMode', form);
  const allValues = Form.useWatch([], form);
  const selectedFields = Form.useWatch('fields', form) as string[] | undefined;
  const [maskRows, setMaskRows] = useState<MaskRow[]>([]);

  useEffect(() => {
    const fields = selectedFields || [];
    setMaskRows((prev) => {
      const prevMap = new Map(prev.map((item) => [item.field, item.algorithm]));
      return fields.map((field) => ({
        key: field,
        field,
        algorithm: prevMap.get(field) ?? 'SHA-256',
      }));
    });
  }, [selectedFields]);

  useEffect(() => {
    if (deliveryLevel === 'low') {
      const controls = (form.getFieldValue('controls') as string[] | undefined) || [];
      form.setFieldsValue({
        controls: controls.filter((item) => item !== 'watermark'),
        watermarkText: undefined,
        watermarkStrength: undefined,
        evidenceLevel: '仅记录结果',
        evidenceFrequency: undefined,
      });
    } else {
      form.setFieldValue('evidenceLevel', undefined);
    }
  }, [deliveryLevel, form]);

  const next = async () => {
    if (step === 0) await form.validateFields(['policyName', 'contract', 'deliveryMode']);
    if (step === 1) await form.validateFields(['assets', 'fields']);
    if (step === 2) {
      const base = ['downloadThreshold', 'validity'];
      if (deliveryLevel === 'high') {
        await form.validateFields([...base, 'watermarkText', 'watermarkStrength']);
      } else {
        await form.validateFields(base);
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    const baseFields = ['ipWhitelist', 'enableSM', 'chainNetwork'];
    if (deliveryMode === 'Push') {
      await form.validateFields([...baseFields, 'pushUrl']);
    } else {
      await form.validateFields(baseFields);
    }
    if (deliveryLevel === 'high') {
      await form.validateFields(['evidenceFrequency']);
    } else {
      await form.validateFields(['evidenceLevel']);
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      message.success('策略已发布并同步至分布式连接器');
      navigate('/delivery/audit');
    }, 1200);
  };

  const summary = useMemo(() => {
    const v = allValues || {};
    const assetCount = Array.isArray(v.assets) ? v.assets.length : 0;
    const fieldCount = Array.isArray(v.fields) ? v.fields.length : 0;
    const controlText = Array.isArray(v.controls) && v.controls.length > 0 ? v.controls.join('、') : '未设置';
    const validity = Array.isArray(v.validity) && v.validity.length === 2 ? `${dayjs(v.validity[0]).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(v.validity[1]).format('YYYY-MM-DD HH:mm')}` : '未设置';
    return {
      policyName: v.policyName || '-',
      contract: v.contract || '-',
      mode: v.deliveryMode || '-',
      assets: assetCount,
      fields: fieldCount,
      rule: v.desensitizationRule || '-',
      threshold: v.downloadThreshold || '-',
      controls: controlText,
      validity,
      ipWhitelist: v.ipWhitelist || '-',
      sm: v.enableSM ? '开启' : '关闭',
      pushUrl: v.pushUrl || '-',
      level: deliveryLevel === 'low' ? '标准低密交付' : '安全高中交付',
      evidenceLevel: v.evidenceLevel || '-',
      evidenceFrequency: v.evidenceFrequency || '-',
      watermarkText: v.watermarkText || '-',
      watermarkStrength: v.watermarkStrength || '-',
    };
  }, [allValues, deliveryLevel]);

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>
        新建交付策略
      </Title>
      <Card
        size="small"
        style={
          deliveryLevel === 'high'
            ? {
                borderColor: '#1d39c4',
                background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)',
              }
            : undefined
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <Radio.Group
            value={deliveryLevel}
            onChange={(e) => dispatchLevel({ type: 'SET_LEVEL', level: e.target.value })}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '标准低密交付', value: 'low' },
              { label: '安全高中交付', value: 'high' },
            ]}
          />
          {deliveryLevel === 'high' && <Text type="secondary">Security-Shield: 中阶安全域已开启</Text>}
        </div>
        <Steps current={step} items={[{ title: '基础信息' }, { title: '数据范围' }, { title: '约束策略' }, { title: '安全设置' }]} />
        <Form
          form={form}
          layout="vertical"
          className="mt-6"
          initialValues={{
            contract: 'ODRL-CN-10021',
            deliveryMode: 'Pull',
            controls: ['mTLS'],
            desensitizationRule: '字段掩码规则-A',
            downloadThreshold: 5,
            chainNetwork: 'Fabric',
            enableSM: true,
            evidenceLevel: '仅记录结果',
          }}
        >
          {step === 0 && (
            <>
              <Form.Item name="policyName" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
                <Input placeholder="请输入策略名称" />
              </Form.Item>
              <Form.Item name="contract" label="关联合约" rules={[{ required: true, message: '请选择关联合约' }]}>
                <Select
                  options={[
                    { label: 'ODRL-CN-10021', value: 'ODRL-CN-10021' },
                    { label: 'ODRL-CN-10022', value: 'ODRL-CN-10022' },
                    { label: 'ODRL-CN-10023', value: 'ODRL-CN-10023' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="deliveryMode" label="交付模式" rules={[{ required: true, message: '请选择交付模式' }]}>
                <Select options={[{ label: 'Pull', value: 'Pull' }, { label: 'Push', value: 'Push' }]} />
              </Form.Item>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item name="assets" label="数据资产选择" rules={[{ required: true, message: '请选择资产' }]}>
                <TreeSelect treeData={treeData} treeCheckable showCheckedStrategy={TreeSelect.SHOW_CHILD} placeholder="请选择资产" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="fields"
                label="数据字段勾选"
                rules={[{ required: true, message: '请至少勾选一个字段' }]}
              >
                <Checkbox.Group
                  options={[
                    { label: 'user_id', value: 'user_id' },
                    { label: 'order_amount', value: 'order_amount' },
                    { label: 'pay_time', value: 'pay_time' },
                    { label: 'region', value: 'region' },
                  ]}
                />
              </Form.Item>
            </>
          )}
          {step === 2 && (
            <>
              <Form.Item name="controls" label="Usage Control">
                <Checkbox.Group
                  options={[
                    { label: '开启 mTLS 加密', value: 'mTLS' },
                    { label: '开启流式传输', value: 'stream' },
                    ...(deliveryLevel === 'high' ? [{ label: '开启隐形水印', value: 'watermark' }] : []),
                  ]}
                />
              </Form.Item>
              {deliveryLevel === 'high' && (
                <Card size="small" className="mb-4" title="字段脱敏配置（中阶安全域）">
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="key"
                    dataSource={maskRows}
                    locale={{ emptyText: '请先在数据范围中勾选字段' }}
                    columns={[
                      { title: '字段名', dataIndex: 'field' },
                      {
                        title: '脱敏算法',
                        dataIndex: 'algorithm',
                        render: (_: string, record: MaskRow) => (
                          <Select
                            value={record.algorithm}
                            style={{ width: 180 }}
                            options={[
                              { label: 'SHA-256', value: 'SHA-256' },
                              { label: '随机掩码', value: '随机掩码' },
                              { label: '对称加密', value: '对称加密' },
                            ]}
                            onChange={(value) => {
                              setMaskRows((prev) =>
                                prev.map((item) =>
                                  item.key === record.key ? { ...item, algorithm: value as MaskRow['algorithm'] } : item,
                                ),
                              );
                            }}
                          />
                        ),
                      },
                    ]}
                  />
                </Card>
              )}
              {deliveryLevel === 'high' && (
                <Card size="small" className="mb-4" title="水印配置">
                  <Form.Item name="watermarkText" label="水印文本" rules={[{ required: true, message: '请输入水印文本' }]}>
                    <Input placeholder="如：TrustedSpace-Confidential" />
                  </Form.Item>
                  <Form.Item
                    name="watermarkStrength"
                    label="水印强度"
                    rules={[{ required: true, message: '请选择水印强度' }]}
                  >
                    <Select
                      options={[
                        { label: '低', value: '低' },
                        { label: '中', value: '中' },
                        { label: '高', value: '高' },
                      ]}
                    />
                  </Form.Item>
                </Card>
              )}
              <Form.Item name="downloadThreshold" label="下载次数限制" rules={[{ required: true, message: '请输入次数限制' }]}>
                <InputNumber min={1} max={9999} style={{ width: 240 }} />
              </Form.Item>
              <Form.Item name="validity" label="策略有效期（Temporal Constraint）" rules={[{ required: true, message: '请选择有效期' }]}>
                <RangePicker showTime />
              </Form.Item>
            </>
          )}
          {step === 3 && (
            <>
              <Form.Item name="ipWhitelist" label="IP 白名单" rules={[{ required: true, message: '请输入 IP 白名单' }]}>
                <TextArea rows={4} placeholder="一行一个 IP/CIDR，例如：10.1.1.0/24" />
              </Form.Item>
              <Form.Item name="chainNetwork" label="存证网络" rules={[{ required: true, message: '请选择网络' }]}>
                <Select options={[{ label: 'Fabric', value: 'Fabric' }, { label: 'BCOS', value: 'BCOS' }]} />
              </Form.Item>
              {deliveryLevel === 'low' ? (
                <Form.Item name="evidenceLevel" label="存证级别">
                  <Input value="仅记录结果" disabled />
                </Form.Item>
              ) : (
                <Form.Item
                  name="evidenceFrequency"
                  label="存证频率"
                  rules={[{ required: true, message: '请选择存证频率' }]}
                >
                  <Select
                    options={[
                      { label: '按批次上链', value: '按批次上链' },
                      { label: '按分片上链', value: '按分片上链' },
                    ]}
                  />
                </Form.Item>
              )}
              <Form.Item name="enableSM" label="国密算法开启" valuePropName="checked">
                <Switch />
              </Form.Item>
              {deliveryMode === 'Push' && (
                <Form.Item
                  name="pushUrl"
                  label="目标推送地址(URL)"
                  rules={[
                    { required: true, message: '请输入目标推送地址' },
                    { type: 'url', message: '请输入合法 URL' },
                  ]}
                >
                  <Input placeholder="https://receiver.example.com/push" />
                </Form.Item>
              )}
              <Text type="secondary">确认后将发布策略并同步到分布式连接器。</Text>
            </>
          )}
        </Form>

        <Card size="small" className="mt-4 bg-gray-50" title="策略预览（ODRL 摘要）">
          <div className="text-sm leading-7">
            <div>交付等级：{summary.level}</div>
            <div>策略名称：{summary.policyName}</div>
            <div>关联合约：{summary.contract}</div>
            <div>交付模式：{summary.mode}</div>
            <div>数据范围：{summary.assets} 个资产 / {summary.fields} 个字段</div>
            <div>约束策略：{summary.controls}</div>
            {deliveryLevel === 'high' && <div>字段脱敏配置：{maskRows.length} 个字段已配置</div>}
            {deliveryLevel === 'high' && <div>水印文本：{summary.watermarkText}</div>}
            {deliveryLevel === 'high' && <div>水印强度：{summary.watermarkStrength}</div>}
            <div>下载次数限制：{summary.threshold}</div>
            <div>策略有效期：{summary.validity}</div>
            <div>存证网络：{form.getFieldValue('chainNetwork') || '-'}</div>
            {deliveryLevel === 'low' ? (
              <div>存证级别：仅记录结果</div>
            ) : (
              <div>存证频率：{summary.evidenceFrequency}</div>
            )}
            <div>国密算法：{summary.sm}</div>
            {deliveryMode === 'Push' && <div>目标推送地址：{summary.pushUrl}</div>}
            <div>IP 白名单：{summary.ipWhitelist}</div>
          </div>
        </Card>

        <Space className="mt-4">
          {step > 0 && <Button onClick={prev}>上一步</Button>}
          {step < 3 ? (
            <Button type="primary" onClick={() => void next()}>
              下一步
            </Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={() => void submit()}>
              {deliveryLevel === 'low' ? '创建并发布' : '开启中密传输任务'}
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default DeliveryPolicyWizard;

