"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Burger, Container, Drawer, Group, Menu, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MalteseCross } from "@/app/components/MalteseCross";
import { LoginButton } from "@/app/components/auth/LoginButton";
import { useAuth } from "@/app/components/auth/AuthProvider";
import classes from "./HeaderNav.module.css";

const publicLinks = [
  { link: "/apply", label: "Apply" },
  { link: "/feedback", label: "Feedback" },
  { link: "/run-log", label: "Run Log" },
  { link: "/faq", label: "FAQ" },
  { link: "/contact", label: "Contact" },
];

const memberSubLinks = [
  { link: "/members/run-log", label: "Run Log" },
  { link: "/members/apparatus-checks", label: "Apparatus Checks" },
  { link: "/members/apparatus-maintenance", label: "Apparatus Maintenance" },
  { link: "/members/roster", label: "Roster" },
  { link: "/members/charts", label: "Analytics" },
];

const adminSubLinks = [
  { link: "/members/users", label: "Manage Users" },
];

export function HeaderNav() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    close();
  }, [pathname, close]);

  const membersSubItems = [...memberSubLinks, ...(isAdmin ? adminSubLinks : [])];
  const isMembersActive = pathname?.startsWith("/members") || false;

  const publicItems = publicLinks.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={
        pathname === link.link || pathname?.startsWith(link.link + "/") || undefined
      }
    >
      {link.label}
    </Link>
  ));

  return (
    <>
      <header className={classes.header}>
        <Container className={classes.inner}>
          <Link href="/">
            <MalteseCross size={28} />
          </Link>

          <Group gap={5} visibleFrom="xs">
            {publicItems}
            {user && (
              <Menu shadow="md" width={160} trigger="hover" openDelay={50} closeDelay={100}>
                <Menu.Target>
                  <span
                    className={classes.link}
                    data-active={isMembersActive || undefined}
                    style={{ cursor: "pointer" }}
                  >
                    Members
                  </span>
                </Menu.Target>
                <Menu.Dropdown>
                  {membersSubItems.map((sub) => (
                    <Menu.Item key={sub.link} component={Link} href={sub.link}>
                      {sub.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
            <LoginButton />
          </Group>

          <Group gap="xs" hiddenFrom="xs">
            {!user && <LoginButton />}
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              aria-label="Toggle navigation"
            />
          </Group>
        </Container>
      </header>

      <Drawer
        opened={opened}
        onClose={close}
        title={<Link href="/" onClick={close}><MalteseCross size={24} /></Link>}
        hiddenFrom="xs"
        padding="md"
      >
        <Stack gap="xs" onClick={close}>
          {publicItems}
          {user && (
            <>
              <Text size="sm" fw={700} c="dimmed" mt="xs">
                Members
              </Text>
              {membersSubItems.map((sub) => (
                <Link
                  key={sub.link}
                  href={sub.link}
                  className={classes.link}
                  data-active={pathname === sub.link || undefined}
                  style={{ paddingLeft: 24 }}
                >
                  {sub.label}
                </Link>
              ))}
            </>
          )}
          <LoginButton onAction={close} variant="simple" />
        </Stack>
      </Drawer>

      {user && isMembersActive && (
        <nav className={classes.subnav}>
          <Container className={classes.subnavInner}>
            <ScrollArea scrollbarSize={0} type="never">
              <Group gap={0} wrap="nowrap">
                {membersSubItems.map((sub) => (
                  <Link
                    key={sub.link}
                    href={sub.link}
                    className={classes.subnavLink}
                    data-active={pathname === sub.link || pathname?.startsWith(sub.link + "/") || undefined}
                  >
                    {sub.label}
                  </Link>
                ))}
              </Group>
            </ScrollArea>
          </Container>
        </nav>
      )}
    </>
  );
}
