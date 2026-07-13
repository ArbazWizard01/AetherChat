import React, { useState } from "react";
import { Input, Button, Tabs, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext.js";

import {
  CenteredContainer,
  StyledCard,
  HeaderContainer,
  BrandTitle,
  StyledForm,
  FormFooter,
} from "./AuthView.styles.js";

const { Text } = Typography;
type AuthMode = "login" | "register";

export const AuthView: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [form] = StyledForm.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

      const response = await axios.post(`http://localhost:8080${endpoint}`, {
        username: values.username,
        password: values.password,
      });

      if (activeTab === "login") {
        message.success("Welcome back to AetherChat!");
        login(response.data.token, response.data.user);
      } else {
        message.success("Registration successful! Flipping to login panel.");
        setActiveTab("login");
        form.resetFields();
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || "An unexpected server error occurred.";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenteredContainer>
      <StyledCard>
        <HeaderContainer>
          <BrandTitle level={2}>AetherChat</BrandTitle>
          <Text type="secondary">Secure, real-time decentralized threads</Text>
        </HeaderContainer>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as AuthMode);
            form.resetFields();
          }}
          centered
          items={[
            { label: "Sign In", key: "login" },
            { label: "Create Account", key: "register" },
          ]}
        />

        <StyledForm form={form} layout="vertical" onFinish={handleSubmit}>
          <StyledForm.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              size="large"
            />
          </StyledForm.Item>

          <StyledForm.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </StyledForm.Item>

          <StyledForm.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              {activeTab === "login" ? "Log In" : "Register Now"}
            </Button>
          </StyledForm.Item>
        </StyledForm>

        <FormFooter>
          <Text type="secondary">
            {activeTab === "login"
              ? "New to the platform?"
              : "Already possess an identity?"}{" "}
            <a
              onClick={() =>
                setActiveTab(activeTab === "login" ? "register" : "login")
              }
            >
              {activeTab === "login" ? "Create an account" : "Sign in instead"}
            </a>
          </Text>
        </FormFooter>
      </StyledCard>
    </CenteredContainer>
  );
};
