import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Check,
  Loader2,
  Camera,
  Globe,
  Mail,
} from "lucide-react";
import {
  GithubOutlined,
  LinkedinOutlined,
  InstagramOutlined,
} from "@ant-design/icons";

import {
  PageContainer,
  TopHeader,
  BackButton,
  HeaderTitle,
  MainContent,
  SettingsCard,
  AvatarHeaderSection,
  AvatarWrapper,
  AvatarOverlay,
  AvatarImage,
  AvatarFallback,
  UserMeta,
  ProfileTitle,
  ProfileSubtitle,
  Form,
  SectionTitle,
  FormGroup,
  Label,
  InputWrapper,
  Input,
  TextArea,
  GridTwoColumns,
  ErrorAlert,
  SuccessAlert,
  ActionFooter,
  SubmitButton,
} from "./ProfilePage.styles.js";

export interface UserProfileData {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

interface ProfilePageProps {
  currentUser: UserProfileData;
  onBack: () => void;
  onProfileUpdated: (updatedUser: Partial<UserProfileData>) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onBack,
  onProfileUpdated,
}) => {
  const [username, setUsername] = useState(currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [githubUrl, setGithubUrl] = useState(currentUser?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(
    currentUser?.linkedinUrl || "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(currentUser?.websiteUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(
    currentUser?.instagramUrl || "",
  );

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setBio(currentUser.bio || "");
      setGithubUrl(currentUser.githubUrl || "");
      setLinkedinUrl(currentUser.linkedinUrl || "");
      setWebsiteUrl(currentUser.websiteUrl || "");
      setInstagramUrl(currentUser.instagramUrl || "");
    }
  }, [currentUser?.id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setAvatarUrl(compressedBase64);
      };
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!username.trim() || !email.trim()) {
      setError("Username and Email are required fields.");
      return;
    }

    setLoading(true);

    const payload = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: avatarUrl.trim(),
      bio: bio.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      instagramUrl: instagramUrl.trim(),
    };

    try {
      const response = await axios.patch(
        "http://localhost:8080/api/users/profile",
        payload,
        { withCredentials: true },
      );

      const serverUser = response.data?.user || response.data || {};

      const finalInstagramUrl = serverUser.instagramUrl || payload.instagramUrl;

      const normalizedUser: UserProfileData = {
        id: serverUser.id || currentUser.id,
        username: serverUser.username || payload.username,
        email: serverUser.email || payload.email,
        avatarUrl: serverUser.avatarUrl || payload.avatarUrl,
        bio: serverUser.bio || payload.bio,
        githubUrl: serverUser.githubUrl || payload.githubUrl,
        linkedinUrl: serverUser.linkedinUrl || payload.linkedinUrl,
        websiteUrl: serverUser.websiteUrl || payload.websiteUrl,
        instagramUrl: finalInstagramUrl,
      };

      setInstagramUrl(finalInstagramUrl);
      onProfileUpdated(normalizedUser);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <TopHeader>
        <BackButton onClick={onBack} title="Back to Chat">
          <ArrowLeft size={20} />
        </BackButton>
        <HeaderTitle>Profile & Settings</HeaderTitle>
      </TopHeader>

      <MainContent>
        <SettingsCard>
          <AvatarHeaderSection>
            <AvatarWrapper
              onClick={handleAvatarClick}
              title="Click to change photo"
            >
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : (
                <AvatarFallback>
                  {typeof username === "string" && username.length > 0
                    ? username.charAt(0).toUpperCase()
                    : "U"}
                </AvatarFallback>
              )}
              <AvatarOverlay>
                <Camera size={18} />
                <span>Change</span>
              </AvatarOverlay>
            </AvatarWrapper>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <UserMeta>
              <ProfileTitle>{username || "User Profile"}</ProfileTitle>
              <ProfileSubtitle>
                {email || "Click photo to update avatar"}
              </ProfileSubtitle>
            </UserMeta>
          </AvatarHeaderSection>

          <Form onSubmit={handleSave}>
            {error && <ErrorAlert>{error}</ErrorAlert>}

            {success && (
              <SuccessAlert>
                <Check size={16} /> Profile updated successfully!
              </SuccessAlert>
            )}

            <SectionTitle>Basic Info</SectionTitle>

            <GridTwoColumns>
              <FormGroup>
                <Label htmlFor="usernameInput">
                  Username <span style={{ color: "#ff4d4f" }}>*</span>
                </Label>
                <InputWrapper>
                  <User size={18} />
                  <Input
                    id="usernameInput"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="emailInput">
                  Email Address <span style={{ color: "#ff4d4f" }}>*</span>
                </Label>
                <InputWrapper>
                  <Mail size={18} />
                  <Input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </InputWrapper>
              </FormGroup>
            </GridTwoColumns>

            <FormGroup>
              <Label htmlFor="bioInput">Bio</Label>
              <TextArea
                id="bioInput"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others a bit about yourself..."
                maxLength={160}
              />
            </FormGroup>

            <SectionTitle>Social Links</SectionTitle>

            <GridTwoColumns>
              <FormGroup>
                <Label htmlFor="githubInput">GitHub</Label>
                <InputWrapper>
                  <GithubOutlined
                    style={{
                      position: "absolute",
                      left: 12,
                      color: "#8c8c8c",
                      fontSize: 18,
                    }}
                  />
                  <Input
                    id="githubInput"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="instagramInput">Instagram</Label>
                <InputWrapper>
                  <InstagramOutlined
                    style={{
                      position: "absolute",
                      left: 12,
                      color: "#8c8c8c",
                      fontSize: 18,
                    }}
                  />
                  <Input
                    id="instagramInput"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </InputWrapper>
              </FormGroup>
            </GridTwoColumns>

            <GridTwoColumns>
              <FormGroup>
                <Label htmlFor="linkedinInput">LinkedIn</Label>
                <InputWrapper>
                  <LinkedinOutlined
                    style={{
                      position: "absolute",
                      left: 12,
                      color: "#8c8c8c",
                      fontSize: 18,
                    }}
                  />
                  <Input
                    id="linkedinInput"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="websiteInput">Website / Portfolio</Label>
                <InputWrapper>
                  <Globe size={18} />
                  <Input
                    id="websiteInput"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </InputWrapper>
              </FormGroup>
            </GridTwoColumns>

            <ActionFooter>
              <SubmitButton type="submit" disabled={loading}>
                {loading && <Loader2 size={16} className="spinner" />}
                Save Changes
              </SubmitButton>
            </ActionFooter>
          </Form>
        </SettingsCard>
      </MainContent>
    </PageContainer>
  );
};
