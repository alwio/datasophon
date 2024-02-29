import { FieldLabel, ModalForm, ProFormSelect } from '@ant-design/pro-components'
import { App, Form } from 'antd';
import { forwardRef, useState, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { APIS } from '../../../services/service';

interface RoleGroupType {
  roleGroupId: string
}

const RoleGroupModal = forwardRef((props: any, ref) => {
  useImperativeHandle(ref, () => ({
    init,
  }));


  const { message } = App.useApp();
  const { t } = useTranslation()
  const [ form ] = Form.useForm<RoleGroupType>();
  const [open, setOpen] = useState(false)
  const [roleGroupList, setRoleGroupList] = useState<any>([])

  const init = (serviceId: string) => {
    getRoleGroupList(serviceId)
    setOpen(true)

    form.resetFields()
  }

  const getRoleGroupList = async (serviceId: string) => {
    const params = {
      serviceInstanceId: serviceId
    }

    const { code, data, msg } = await APIS.InstanceApi.getRoleGroupList(params)

    if (code === 200) {
      setRoleGroupList(data || [])
    } else {
      message.error(msg)
    }
  }

  const handleSubmit = async (values: RoleGroupType) => {
    const success = await props.bindRoleGroup(values.roleGroupId)

    return success
  }

  return (
    <ModalForm
      title={t('service.assignToRoleGroup')}
      width='500px'
      layout='horizontal'
      form={form}
      open={open}
      onOpenChange={setOpen}
      onFinish={handleSubmit}
    >
      <ProFormSelect
        label={t('service.roleGroupList')}
        name='roleGroupId'
        placeholder={t('service.roleGroupListPlaceholder')}
        options={roleGroupList}
        fieldProps={{
          fieldNames: {
            label: 'roleGroupName',
            value: 'id'
          }
        }}
        rules={[{required: true, message: t('service.roleGroupListPlaceholder')}]}
      />
    </ModalForm>
  )
})

export default RoleGroupModal