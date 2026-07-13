import styled from "styled-components";
import { Card, Form, Typography } from "antd";

const { Title } = Typography;

export const CenteredContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5; 
`;

export const StyledCard = styled(Card)`
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
`;

export const HeaderContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

export const BrandTitle = styled(Title)`
  && {
    margin: 0;
    color: #1890ff;
  }
`;

export const StyledForm = styled(Form)`
  margin-top: 16px;
`;

export const FormFooter = styled.div`
  text-align: center;
  margin-top: 12px;
`;