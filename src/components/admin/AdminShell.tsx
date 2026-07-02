"use client";

import {
  AccountBookOutlined,
  BarChartOutlined,
  BellOutlined,
  CarryOutOutlined,
  DashboardOutlined,
  DownOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MenuOutlined,
  MessageOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Form, Input, Layout, Modal, Space } from 'antd';
import Link from 'next/link';
import { ReactNode, useState } from 'react';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { label: 'Dashboard', icon: <DashboardOutlined />, href: '/admin/dashboard' },
  { label: 'Admins', icon: <TeamOutlined />, href: '#' },
  { label: 'Analytics', icon: <BarChartOutlined />, href: '#' },
  { label: 'Accounts', icon: <AccountBookOutlined />, href: '#' },
  { label: 'Store', icon: <ShopOutlined />, href: '#' },
  { label: 'Orders', icon: <ShoppingCartOutlined />, href: '#' },
  { label: 'Wholesale', icon: <ProductOutlined />, href: '#' },
  { label: 'Pages', icon: <FileTextOutlined />, href: '#' },
  { label: 'Settings', icon: <SettingOutlined />, href: '#' },
  { label: 'Reports', icon: <CarryOutOutlined />, href: '/admin/user/report' },
];

type AdminShellProps = {
  active: string;
  children: ReactNode;
};

export function AdminShell({ active, children }: AdminShellProps) {
  const [messageOpen, setMessageOpen] = useState(false);

  return (
    <Layout className="admin-shell">
      <Sider width={176} className="admin-sidebar">
        <div className="admin-logo">
          <img src="/muaz-logo.svg" alt="Muaz Technology" />
        </div>

        <nav className="admin-menu">
          {menuItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className={`admin-menu-item ${active === item.label ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.label !== 'Dashboard' && <DownOutlined className="admin-menu-arrow" />}
              </Link>
              {item.label === 'Store' && active === 'Store' && (
                <div className="submenu">
                  {['Category', 'Sub Category', 'Size & Segment', 'Single Products', 'Variant Products', 'Purchase', 'Return'].map((label) => (
                    <Link key={label} href="#" className="submenu-item">{label}</Link>
                  ))}
                  <Link href="/admin/stock/overview" className="submenu-item active-dot">Inventory</Link>
                </div>
              )}
            </div>
          ))}
        </nav>
      </Sider>

      <Layout>
        <Header className="admin-header">
          <Space size={12} wrap>
            <Button className="header-icon-btn" icon={<MenuOutlined />} />
            <a href="https://www.muazbd.com/" target="_blank" rel="noreferrer">
              <Button className="top-action ghost-blue" icon={<GlobalOutlined />}>View Website</Button>
            </a>
            <Button className="top-action" icon={<ShoppingCartOutlined />}>User Order</Button>
            <Link href="/admin/stock/overview">
              <Button className="top-action ghost-blue" icon={<ProductOutlined />}>Inventory</Button>
            </Link>
            <Button className="top-action primary-action" icon={<BellOutlined />}>Complain</Button>
            <Link href="/admin/tasks">
              <Button className="top-action" icon={<OrderedListOutlined />}>My Task</Button>
            </Link>
            <Button className="top-action primary-action" icon={<SendOutlined />} onClick={() => setMessageOpen(true)}>
              Send Message
            </Button>
          </Space>

          <Space size={10} className="admin-user">
            <Avatar size={34} src="https://i.pravatar.cc/64?img=12" />
            <span>Rahat</span>
            <DownOutlined />
          </Space>
        </Header>

        <Content className="admin-content">
          {children}
        </Content>
      </Layout>

      <Modal
        open={messageOpen}
        onCancel={() => setMessageOpen(false)}
        footer={null}
        width={440}
        centered
        className="send-message-modal"
        title={<><SendOutlined /> Send Message</>}
      >
        <Form layout="vertical">
          <Form.Item label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item label="Message">
            <Input.TextArea rows={5} placeholder="Write your message" />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button type="primary" icon={<SendOutlined />}>Send</Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
