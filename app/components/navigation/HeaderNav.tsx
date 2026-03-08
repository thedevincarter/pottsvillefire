"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Burger, Container, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MantineLogo } from "@mantinex/mantine-logo";
import classes from "./HeaderNav.module.css";

const links = [
  { link: "/apply", label: "Apply" },
  { link: "/feedback", label: "Feedback" },
  { link: "/run-log", label: "Run Log" },
];

export function HeaderNav() {
  const [opened, { toggle }] = useDisclosure(false);
  const pathname = usePathname();

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
    <header className={classes.header}>
      <Container className={classes.inner}>
        <Link href="/"><MantineLogo size={28} /></Link>

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
  );
}
