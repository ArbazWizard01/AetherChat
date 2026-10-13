import React, { useMemo } from "react";
import { Drawer, Tag, Button } from "antd";
import {
  UserOutlined,
  GithubOutlined,
  LinkedinOutlined,
  GlobalOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
import {
  DrawerProfileHeader,
  DrawerAvatar,
  DrawerUsername,
  DrawerEmail,
  DrawerSectionContainer,
  DrawerSectionTitle,
  DrawerBioText,
  DrawerLinksSectionTitle,
  DrawerLinksContainer,
  DrawerEmptyLinksText,
} from "./ChatPane.styles";

interface PeerDetails {
  id?: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
}

interface UserInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  peerDetails: PeerDetails | null;
  fallbackTitle: string;
  isPeerOnline: boolean;
}

const formatExternalUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

export const UserInfoDrawer: React.FC<UserInfoDrawerProps> = ({
  isOpen,
  onClose,
  peerDetails,
  fallbackTitle,
  isPeerOnline,
}) => {
  const username = peerDetails?.username || fallbackTitle;

  const formattedLinks = useMemo(() => {
    return {
      github: formatExternalUrl(peerDetails?.githubUrl),
      linkedin: formatExternalUrl(peerDetails?.linkedinUrl),
      instagram: formatExternalUrl(peerDetails?.instagramUrl),
      website: formatExternalUrl(peerDetails?.websiteUrl),
    };
  }, [peerDetails]);

  const hasAnyLink = Boolean(
    formattedLinks.github ||
    formattedLinks.linkedin ||
    formattedLinks.instagram ||
    formattedLinks.website,
  );

  return (
    <Drawer
      title="Contact Info"
      placement="right"
      width={340}
      onClose={onClose}
      open={isOpen}
      destroyOnClose
    >
      <DrawerProfileHeader>
        <DrawerAvatar
          size={96}
          src={peerDetails?.avatarUrl}
          icon={<UserOutlined />}
        >
          {!peerDetails?.avatarUrl && username.charAt(0).toUpperCase()}
        </DrawerAvatar>

        <DrawerUsername>{username}</DrawerUsername>

        <DrawerEmail>
          {peerDetails?.email ? peerDetails.email : "No email provided"}
        </DrawerEmail>

        <Tag color={isPeerOnline ? "green" : "default"}>
          {isPeerOnline ? "Online" : "Offline"}
        </Tag>
      </DrawerProfileHeader>

      <DrawerSectionContainer>
        {peerDetails?.bio && (
          <div>
            <DrawerSectionTitle>Bio</DrawerSectionTitle>
            <DrawerBioText>{peerDetails.bio}</DrawerBioText>
          </div>
        )}

        <div>
          <DrawerLinksSectionTitle>Links</DrawerLinksSectionTitle>
          <DrawerLinksContainer>
            {formattedLinks.github && (
              <Button
                type="default"
                icon={<GithubOutlined />}
                href={formattedLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                block
              >
                GitHub
              </Button>
            )}

            {formattedLinks.linkedin && (
              <Button
                type="default"
                icon={<LinkedinOutlined />}
                href={formattedLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                block
              >
                LinkedIn
              </Button>
            )}

            {formattedLinks.instagram && (
              <Button
                type="default"
                icon={<InstagramOutlined />}
                href={formattedLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                block
              >
                Instagram
              </Button>
            )}

            {formattedLinks.website && (
              <Button
                type="default"
                icon={<GlobalOutlined />}
                href={formattedLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                block
              >
                Website
              </Button>
            )}

            {!hasAnyLink && (
              <DrawerEmptyLinksText>
                No social links added yet.
              </DrawerEmptyLinksText>
            )}
          </DrawerLinksContainer>
        </div>
      </DrawerSectionContainer>
    </Drawer>
  );
};
