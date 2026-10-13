import styled, { keyframes } from "styled-components";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f7f9fa;
  overflow: hidden;
`;

export const TopHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  height: 64px;
  padding: 0 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #595959;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
    color: #1f1f1f;
  }
`;

export const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
`;

export const MainContent = styled.main`
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 32px 16px;
  overflow-y: auto;
`;

export const SettingsCard = styled.div`
  width: 100%;
  max-width: 620px;
  height: fit-content;
  background-color: #ffffff;
  border: 1px solid #eaedf0;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 40px;
`;

export const AvatarHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
`;

export const AvatarWrapper = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover > div.avatar-overlay {
    opacity: 1;
  }
`;

export const AvatarOverlay = styled.div.attrs({ className: "avatar-overlay" })`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
  gap: 4px;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  background-color: #1890ff;
  color: #ffffff;
  font-size: 34px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  user-select: none;
`;

export const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ProfileTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

export const ProfileSubtitle = styled.p`
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
`;

export const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 0 0;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #434343;
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 12px;
    color: #8c8c8c;
  }
`;

export const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 16px 0 40px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  color: #1f1f1f;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1f1f1f;
  outline: none;
  resize: vertical;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

export const GridTwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const ErrorAlert = styled.div`
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  padding: 10px 14px;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 13px;
`;

export const SuccessAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  padding: 10px 14px;
  border-radius: 8px;
  color: #52c41a;
  font-size: 13px;
`;

export const ActionFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

export const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  background-color: #1890ff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #096dd9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;
