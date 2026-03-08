"use client";

import cx from "clsx";
import Link from "next/link";
import { Button, Container, Overlay, Text, Title } from "@mantine/core";
import classes from "./HeroImageBackground.module.css";

export function HeroImageBackground() {
  return (
    <div className={classes.wrapper}>
      <Overlay color="#000" opacity={0.65} zIndex={1} />

      <div className={classes.inner}>
        <Title className={classes.title}>Pottsville Fire Department</Title>

        <Container size={640}>
          <Text size="lg" className={classes.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            libero erat, sagittis quis rutrum sed, posuere sed nibh. Curabitur
            vulputate nisl eget urna tincidunt efficitur. Mauris laoreet tellus
            lorem.
          </Text>
        </Container>

        <div className={classes.controls}>
          <Button component={Link} href="/apply" className={classes.control} variant="white" size="lg">
            Apply Now
          </Button>

          <Button
            component={Link}
            href="/run-log"
            className={cx(classes.control, classes.secondaryControl)}
            size="lg"
          >
            Run Log
          </Button>
        </div>
      </div>
    </div>
  );
}
