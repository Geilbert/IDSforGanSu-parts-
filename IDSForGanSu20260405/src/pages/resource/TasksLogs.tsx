import React, { useState } from 'react';
import { 
  Table, Button, Input, Tag, Space, Card, 
  Select, DatePicker, Typography, Modal, Badge,
  Tooltip
} from 'antd';
import { 
  Search, PlayCircle, Clock, FileText,
  Server, Database, RefreshCw,
  Terminal, ExternalLink
} from 'lucide-react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TaskLogItem {
  key: string;
  taskId: string;
  taskName: string;
  type: '数据同步' | '质量检查';
  target: string;
  space: string;
  trigger: '手动触发' | '定时触发';
  startTime: string;
  endTime: string;
  status: 'success' | 'failure' | 'running';
  errorDetail?: string;
}

const TasksLogs: React.FC = () => {
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskLogItem | null>(null);

  const showLog = (record: TaskLogItem) => {
    setSelectedTask(record);
    setIsLogModalVisible(true);
  };

  const columns = [
    {
      title: '任务 ID / 名称',
      key: 'task',
      render: (_: any, record: TaskLogItem) => (
        <div className="flex flex-col">
          <code className="text-xs text-blue-500 mb-1">{record.taskId}</code>
          <span className="font-medium text-gray-800">{record.taskName}</span>
        </div>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === '数据同步' ? 'blue' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '关联空间 / 资源',
      key: 'target',
      render: (_: any, record: TaskLogItem) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Server size={12} /> {record.space}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Database size={14} className="text-gray-400" /> {record.target}
          </div>
        </div>
      ),
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => (
        <span className="text-gray-600 text-sm">{trigger}</span>
      ),
    },
    {
      title: '时间信息',
      key: 'time',
      render: (_: any, record: TaskLogItem) => (
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <PlayCircle size={12} className="text-green-500" />
            <span>始: {record.startTime}</span>
          </div>
          {record.endTime && (
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-gray-400" />
              <span>终: {record.endTime}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'success' ? 'success' : (status === 'failure' ? 'error' : 'processing')} 
          text={status === 'success' ? '执行成功' : (status === 'failure' ? '执行失败' : '正在执行')} 
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TaskLogItem) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small" 
            onClick={() => showLog(record)}
            icon={<FileText size={14} />}
            className="flex items-center gap-1"
          >
            查看日志
          </Button>
          {record.status === 'failure' && (
            <Tooltip title="重试任务">
              <Button type="text" size="small" icon={<RefreshCw size={14} className="text-blue-500" />} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const data: TaskLogItem[] = [
    {
      key: '1',
      taskId: 'TASK-20240407-001',
      taskName: '每日财务流水同步',
      type: '数据同步',
      space: '公共数据集空间',
      target: 'Finance_Records_MySQL',
      trigger: '定时触发',
      startTime: '2024-04-07 08:00:00',
      endTime: '2024-04-07 08:45:12',
      status: 'success',
    },
    {
      key: '2',
      taskId: 'TASK-20240407-005',
      taskName: '用户画像质量体检',
      type: '质量检查',
      space: '营销运营中心',
      target: 'User_Profile_L3',
      trigger: '手动触发',
      startTime: '2024-04-07 10:15:30',
      endTime: '',
      status: 'running',
    },
    {
      key: '3',
      taskId: 'TASK-20240407-002',
      taskName: '历史交易数据迁移',
      type: '数据同步',
      space: '金融研究空间',
      target: 'History_Archive_S3',
      trigger: '手动触发',
      startTime: '2024-04-07 09:00:00',
      endTime: '2024-04-07 09:05:45',
      status: 'failure',
      errorDetail: '连接超时: 无法访问目标 S3 存储桶 "history-archive-v1"，请检查网络配置或认证信息。',
    },
    {
      key: '4',
      taskId: 'TASK-20240406-098',
      taskName: '库存表一致性校验',
      type: '质量检查',
      space: '公共数据集空间',
      target: 'Inventory_Master',
      trigger: '定时触发',
      startTime: '2024-04-06 23:00:00',
      endTime: '2024-04-06 23:02:15',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={3} style={{ margin: 0 }}>任务与日志</Title>
      </div>

      <Card className="shadow-sm border-none bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">任务类型</Text>
            <Select placeholder="全部类型" className="w-full" allowClear>
              <Select.Option value="sync">数据同步</Select.Option>
              <Select.Option value="quality">质量检查</Select.Option>
            </Select>
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">执行状态</Text>
            <Select placeholder="全部状态" className="w-full" allowClear>
              <Select.Option value="success">执行成功</Select.Option>
              <Select.Option value="failure">执行失败</Select.Option>
              <Select.Option value="running">正在执行</Select.Option>
            </Select>
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">时间范围</Text>
            <RangePicker className="w-full" />
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">搜索任务</Text>
            <Input 
              placeholder="搜索任务 ID 或名称..." 
              prefix={<Search size={16} className="text-gray-400" />} 
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={{
            total: 450,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条历史记录`,
          }}
          className="tasks-logs-table"
        />
      </Card>

      {/* Log Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-blue-500" />
            <span>任务详情日志 - {selectedTask?.taskId}</span>
          </div>
        }
        open={isLogModalVisible}
        onCancel={() => setIsLogModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsLogModalVisible(false)}>关闭</Button>,
          <Button key="download" type="primary" ghost icon={<ExternalLink size={14} />}>下载完整日志</Button>
        ]}
        width={700}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 bg-gray-50 p-4 rounded-lg text-sm">
            <div><Text type="secondary">任务名称：</Text>{selectedTask?.taskName}</div>
            <div><Text type="secondary">执行状态：</Text>
              <Badge status={selectedTask?.status === 'success' ? 'success' : (selectedTask?.status === 'failure' ? 'error' : 'processing')} text={selectedTask?.status === 'success' ? '成功' : (selectedTask?.status === 'failure' ? '失败' : '运行中')} />
            </div>
            <div><Text type="secondary">开始时间：</Text>{selectedTask?.startTime}</div>
            <div><Text type="secondary">结束时间：</Text>{selectedTask?.endTime || '-'}</div>
          </div>
          
          <div className="bg-black text-gray-300 p-4 rounded-lg font-mono text-xs min-h-[200px] overflow-auto leading-relaxed">
            <div className="text-gray-500">[2024-04-07 09:00:00] INFO: 任务初始化开始...</div>
            <div className="text-gray-500">[2024-04-07 09:00:01] INFO: 正在获取空间 "{selectedTask?.space}" 的访问令牌...</div>
            <div className="text-gray-500">[2024-04-07 09:00:02] INFO: 目标资源: {selectedTask?.target}</div>
            <div className="text-gray-500">[2024-04-07 09:00:05] INFO: 正在建立安全连接隧道...</div>
            {selectedTask?.status === 'failure' ? (
              <>
                <div className="text-red-400 font-bold">[2024-04-07 09:05:45] ERROR: {selectedTask?.errorDetail}</div>
                <div className="text-red-400">[2024-04-07 09:05:46] FATAL: 任务非正常退出，错误代码: ERR_CONN_TIMEOUT</div>
              </>
            ) : selectedTask?.status === 'success' ? (
              <>
                <div className="text-gray-500">[2024-04-07 08:30:00] INFO: 数据块同步进度 50%...</div>
                <div className="text-gray-500">[2024-04-07 08:45:10] INFO: 正在计算 MD5 校验和...</div>
                <div className="text-green-400 font-bold">[2024-04-07 08:45:12] SUCCESS: 任务执行完毕，同步记录 1,284,000 条。</div>
              </>
            ) : (
              <div className="text-blue-400 animate-pulse">[2024-04-07 10:20:00] PROCESSING: 正在执行质量规则集 "Q_RULE_003"...</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksLogs;
