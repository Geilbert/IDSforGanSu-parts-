import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, List, Row, Segmented, Space, Statistic, Typography } from 'antd';
import { Line, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;

const trend7 = [96, 94, 97, 95, 98, 97, 99];
const trend30 = [92, 93, 94, 95, 94, 96, 97, 96, 95, 96, 97, 97, 98, 97, 98];

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [trendWindow, setTrendWindow] = React.useState<'7天' | '30天'>('7天');
  const gotoFailed = () => navigate('/delivery/orders?status=已失败');
  const pieData = [
    { type: '成功', value: 72 },
    { type: '执行中', value: 18 },
    { type: '失败', value: 10 },
  ];
  const lineData = (trendWindow === '7天' ? trend7 : trend30).map((value, idx) => ({
    day: `${idx + 1}`,
    successRate: value,
  }));

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>交付看板</Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" hoverable onClick={() => navigate('/delivery/orders')}>
            <Statistic title="今日订单总数" value={28} suffix={<Text type="secondary">+12%</Text>} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable onClick={() => navigate('/delivery/orders?status=执行中')}>
            <Statistic title="运行中任务数" value={13} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="低密/中密分布" value="62% / 38%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="近24小时交付总量" value={512} suffix="GB" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="实时动态 Feed">
            <List
              size="small"
              dataSource={[
                '订单 OD-20260413-004 创建成功',
                '文件传输任务 T-10021 失败告警',
                '订单 OD-20260413-001 已完成交付',
                '策略 LP-0008 被订单 OD-20260413-003 引用',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="健康状态监控">
            <div className="mb-6">
              <Text>任务状态分布图</Text>
              <div className="mt-2">
                <Pie
                  data={pieData}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.62}
                  height={220}
                  label={{ text: 'value', style: { fontSize: 12 } }}
                  legend={{ position: 'bottom' }}
                  color={['#52c41a', '#faad14', '#ff4d4f']}
                  interactions={[{ type: 'element-active' }]}
                  onReady={(plot) => {
                    plot.on('element:click', (ev: any) => {
                      const datum = (ev.data as { data?: { type?: string } })?.data;
                      if (datum?.type === '失败') gotoFailed();
                      if (datum?.type === '执行中') navigate('/delivery/orders?status=执行中');
                    });
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text>交付成功率趋势图</Text>
                <Segmented value={trendWindow} options={['7天', '30天']} onChange={(v) => setTrendWindow(v as '7天' | '30天')} />
              </div>
              <Line
                data={lineData}
                xField="day"
                yField="successRate"
                height={220}
                point={{ size: 4, shape: 'circle' }}
                smooth
                yAxis={{ min: 85, max: 100, title: { text: '成功率(%)' } }}
                xAxis={{ title: { text: trendWindow === '7天' ? '近7天' : '近30天' } }}
                tooltip={{ title: 'day' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Space>
          <Button type="primary" onClick={() => navigate('/delivery/orders?create=1')}>创建新订单</Button>
          <Button type="link" onClick={gotoFailed}>查看异常订单</Button>
          <Button type="link" danger onClick={gotoFailed}>失败任务数下钻</Button>
        </Space>
      </Card>
    </div>
  );
};

export default DeliveryDashboard;

