import { Collapse } from 'antd';
import { useTranslation } from 'react-i18next';

import { Swap } from './swap.tsx';

const children = (
  <div className="py-3">
    <Swap />
  </div>
);

export const Advanced = () => {
  const { t } = useTranslation();

  return (
    <Collapse
      ghost
      expandIconPosition="end"
      items={[{ key: 'advanced', label: t('settings.device.advanced'), children }]}
    />
  );
};
