import { PageContainer, ProColumns, ProTable } from '@ant-design/pro-components'
import { AlertOutlined, CheckCircleOutlined, StopOutlined, DownOutlined } from '@ant-design/icons'
import { Modal, Button, Dropdown, Space } from 'antd'
import CodeMirror from '../../../components/CodeMirror'
import RoleGroupModal from './RoleGroupModal'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom';
import { APIS } from '../../../services/service';
import request from '../../../services/request'
import { App } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { MenuProps } from 'antd/lib'

enum OperateType {
  START = 'START',
  STOP = 'STOP',
  RESTART = 'RESTART',
  DECOMMISSION = 'DECOMMISSION',
  ASSIGN = 'ASSIGN',
  DELETE = 'DELETE',
}

interface InstanceType {
  id: number,
  clusterId: number,
  createTime: string,
  hostname: string,
  needRestart: boolean,
  roleGroupId: number,
  roleGroupName: string,
  roleType: string,
  serviceId: number,
  serviceName: string,
  serviceRoleName: string,
  serviceRoleState: string,
  serviceRoleStateCode: number,
  updateTime: string,
}

const ServiceInstance = () => {
  const { t } = useTranslation()
  const { clusterId, serviceId } = useParams()
  const { message, modal } = App.useApp();

  const [roleTypeOptions, setRoleTypeOptions] = useState([])
  const [roleGroupOptions, setRoleGroupOptions] = useState([])
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logContent, setLogContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<React.Key[]>([])
  const tableRef = useRef<any>()
  const codeMirrorRef = useRef<any>()
  const roleGroupModalRef = useRef<any>()
  const currentRecord = useRef<InstanceType>()
  const timer = useRef<any>(null)

  const columns: ProColumns<InstanceType>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: t('service.roleType'),
      valueType: 'select',
      fieldProps: {
        placeholder: t('service.roleTypePlaceholder'),
        options: roleTypeOptions,
        fieldNames: {
          label: 'serviceRoleName',
          value: 'serviceRoleName'
        }
      },
      dataIndex: 'serviceRoleName'
    },
    {
      title: t('service.hostname'),
      fieldProps: {
        placeholder: t('service.hostnamePlaceholder'),
      },
      dataIndex: 'hostname'
    },
    {
      title: t('service.roleGroupName'),
      valueType: 'select',
      fieldProps: {
        placeholder: t('service.roleGroupNamePlaceholder'),
        options: roleGroupOptions,
        fieldNames: {
          label: 'roleGroupName',
          value: 'id'
        }
      },
      dataIndex: 'roleGroupId'
    },
    {
      title: t('service.state'),
      valueType: 'select',
      fieldProps: {
        placeholder: t('service.statePlaceholder'),
        options: [
          { value: "1", label: "正在运行" },
          { value: "2", label: "停止" },
          { value: "3", label: "告警" },
          { value: "4", label: "退役中" },
          { value: "5", label: "已退役" },
        ],
      },
      dataIndex: 'serviceRoleState',
      render: (text, record) => [
        getServiceRoleStateIcon(record.serviceRoleStateCode),
        <span key='text' style={{marginLeft: '10px'}}>{text}</span>
      ]
    },
    {
      title: t('service.operation'),
      valueType: 'option',
      key: 'operation',
      render: (text, record) => [
        <a key='viewLog' onClick={() => viewLog(record)}>{t('service.viewLog')}</a>
      ]
    }
  ]

  const items: MenuProps['items'] = [
    {
      key: OperateType.START,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.START)}}>
          {t('service.start')}
        </a>
      ),
    },
    {
      key: OperateType.STOP,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.STOP)}}>
          {t('service.stop')}
        </a>
      ),
    },
    {
      key: OperateType.RESTART,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.RESTART)}}>
          {t('service.restart')}
        </a>
      ),
    },
    {
      key: OperateType.DECOMMISSION,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.DECOMMISSION)}}>
          {t('service.decommission')}
        </a>
      ),
      disabled: serviceId !== '36' && serviceId !== '37'
    },
    {
      key: OperateType.ASSIGN,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.ASSIGN)}}>
          {t('service.assignToRoleGroup')}
        </a>
      ),
    },
    {
      key: OperateType.DELETE,
      label: (
        <a onClick={() => {handleOperateInstance(OperateType.DELETE)}}>
          {t('service.delete')}
        </a>
      ),
    }
  ]

  const getServiceRoleStateIcon = (serviceRoleStateCode: number) => {
    return serviceRoleStateCode === 1
      ? <CheckCircleOutlined key='icon' style={{color: '#52c41a'}} />
        : serviceRoleStateCode === 2
          ? <StopOutlined key='icon' style={{color: '#f5222f'}} />
            : <AlertOutlined key='icon' style={{color: '#FF8833'}} />
  }

  const getServiceRoleType = async () => {
    const params = {
      serviceInstanceId: serviceId || ''
    }

    const { code, data, msg } = await APIS.InstanceApi.getServiceRoleType(params)

    if (code === 200) {
      setRoleTypeOptions(data || [])
    } else {
      message.error(msg)
    }
  }

  const getServiceRoleGroupList = async () => {
    const params = {
      serviceInstanceId: serviceId || ''
    }

    const { code, data, msg } = await APIS.InstanceApi.getServiceRoleGroupList(params)

    if (code === 200) {
      setRoleGroupOptions(data || [])
    } else {
      message.error(msg)
    }
  }

  const viewLog = async (record?: InstanceType) => {
    currentRecord.current = record
    setLogContent('')
    setLogModalOpen(true)

    getLog()
  }

  const getLog = async () => {
    const params = {
      serviceRoleInstanceId: currentRecord.current!.id
    }

    const { code, data, msg } = await APIS.InstanceApi.getLog(params)

    if (code === 200) {
      setLogContent(data || '')
    } else {
      message.error(msg)
    }
  }

  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedIds(selectedRowKeys)
  }

  const handleOperateInstance = (type: OperateType) => {
    if (!selectedIds.length) {
      message.warning('请至少选择一个实例')
      return
    }

    if (type === OperateType.START) {
      confirmOperate(type)
    }

    if (type === OperateType.STOP) {
      confirmOperate(type)
    }

    if (type === OperateType.RESTART) {
      confirmOperate(type)
    }

    if (type === OperateType.DECOMMISSION) {
      confirmOperate(type)
    }

    if (type === OperateType.ASSIGN) {
      handleAssignInstances()
    }

    if (type === OperateType.DELETE) {
      handleDeleteInstances()
    }
  }

  const confirmOperate = (type: OperateType) => {
    const typeText = type === OperateType.START ? t('service.start') : type === OperateType.STOP ? t('service.stop') : type === OperateType.RESTART ? t('service.restart') : type === OperateType.DECOMMISSION ? t('service.decommission') : ''
    modal.confirm({
      title: '提示',
      content: `确认${typeText}吗？`,
      onOk: async () => {
        if (type === OperateType.DECOMMISSION) {
          handleDecommissionInstances()
        } else {
          handleOperateInstances(type)
        }
      }
    })
  }

  const handleDecommissionInstances = async () => {
    const params = {
      serviceRoleInstanceIds: selectedIds.join(',')
    }
    
    const { code, msg } = await APIS.InstanceApi.decommissionNode(params)

    if (code === 200) {
      message.success('操作成功')
      tableRef.current.clearSelected()
      tableRef.current.reload()
    } else {
      message.error(msg)
    }
  }

  const handleOperateInstances = async (type: OperateType) => {
    const params = {
      clusterId: clusterId || '',
      commandType: type === OperateType.START ? 'START_SERVICE' : type === OperateType.STOP ? 'STOP_SERVICE' : type === OperateType.RESTART ? 'RESTART_SERVICE' : '',
      serviceInstanceId: serviceId || '',
      serviceRoleInstancesIds: selectedIds.join(',')
    }

    const { code, msg } = await APIS.InstanceApi.generateServiceRoleCommand(params)

    if (code === 200) {
      message.success('操作成功')
      tableRef.current.clearSelected()
      tableRef.current.reload()
    } else {
      message.error(msg)
    }
  }

  const handleAssignInstances = () => {
    roleGroupModalRef.current.init(serviceId)
  }

  const bindRoleGroup = async (roleGroupId: string) => {
    const params = {
      roleInstanceIds: selectedIds.join(','),
      roleGroupId
    }

    const { code, msg } = await APIS.InstanceApi.bindRoleGroup(params)

    if (code === 200) {
      message.success('操作成功')
      tableRef.current.clearSelected()
      tableRef.current.reload()
    } else {
      message.error(msg)
    }

    return code === 200
  }

  const handleDeleteInstances = () => {
    modal.confirm({
      title: '提示',
      content: '确认删除吗？',
      onOk: async () => {
        const params = {
          serviceRoleInstancesIds: selectedIds.join(',')
        }

        const { code, msg } = await APIS.InstanceApi.deleteExample(params)

        if (code === 200) {
          message.success('操作成功')
          tableRef.current.clearSelected()
          tableRef.current.reload()
        } else {
          message.error(msg)
        }
      }
    })
  }

  useEffect(() => {
    getServiceRoleType()
    getServiceRoleGroupList()
  }, [])

  // 日志定时刷新
  useEffect(() => {
    if (logModalOpen) {
      timer.current = setInterval(() => {
        getLog()
      }, 10000)
    } else {
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
    }
  }, [logModalOpen])

  useEffect(() => {
    if (logContent) {
      const scroller = codeMirrorRef.current?.editor.querySelector('.cm-scroller')
      scroller?.scrollTo(0, scroller.clientHeight + scroller.scrollHeight)
    }
  },  [logContent])

  return (
    <PageContainer header={{ title: t('service.title')}}>
      <ProTable
        actionRef={tableRef}
        columns={columns}
        rowSelection={{
          onChange: handleSelectionChange
        }}
        tableAlertRender={false}
        rowKey="id"
        loading={loading}
        request={async (params) => {
          setLoading(true)
          const { code, data, total } = await request.ajax({
            method: 'POST',
            url: '/cluster/service/role/instance/list',
            form: {
              ...params,
              // 需要将 current 修改为 page
              page: params.current,
              serviceInstanceId: serviceId
            }
            });
            setLoading(false)
            return {
              data,
              success: code === 200,
              total
            }
          }
        }
        pagination={{
          pageSize: 10
        }}
        toolBarRender={() => [
          <Dropdown menu={{ items }}>
            <Button
              key="button"
              type="primary"
            >
              <Space>
                {t('common.moreOperations')}
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>,
          <Button
            key="button"
            type="primary"
          >
            {t('service.addNewInstance')}
          </Button>,
          <Button
            key="button"
            type="primary"
          >
            {t('service.addRoleGroup')}
          </Button>,
        ]}
        toolbar={{ 
          // 隐藏工具栏设置区
          settings: []
        }}
      />
      <Modal open={logModalOpen} width='100%' title='查看日志' footer={[
        <div key='btns' style={{textAlign: 'center'}}><Button onClick={() => {getLog()}}>刷新</Button></div>
      ]} onCancel={() => {setLogModalOpen(false)}}>
        <CodeMirror ref={codeMirrorRef} value={logContent} editable={false} />
      </Modal>
      <RoleGroupModal ref={roleGroupModalRef} bindRoleGroup={bindRoleGroup} />
    </PageContainer>
  )
}

export default ServiceInstance