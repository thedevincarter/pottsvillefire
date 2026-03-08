"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Burger, Container, Drawer, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MalteseCross } from "@/app/components/MalteseCross";
import classes from "./HeaderNav.module.css";

const links = [
  { link: "/apply", label: "Apply" },
  { link: "/feedback", label: "Feedback" },
  { link: "/run-log", label: "Run Log" },
  { link: "/faq", label: "FAQ" },
  { link: "/contact", label: "Contact" },
];

export function HeaderNav() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  const items = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={pathname === link.link || undefined}
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
            {items}
          </Group>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="xs"
            size="sm"
            aria-label="Toggle navigation"
          />
        </Container>
      </header>

      <Drawer
        opened={opened}
        onClose={close}
        title={<MalteseCross size={24} />}
        hiddenFrom="xs"
        padding="md"
      >
        <Stack gap="xs">{items}</Stack>
      </Drawer>
    </>
  );
}
