"use client";

import cx from "clsx";
import Link from "next/link";
import { Button, Container, Overlay, Text, Title, Stack } from "@mantine/core";
import classes from "./HeroImageBackground.module.css";

export function HeroImageBackground() {
  return (
    <div className={classes.wrapper}>
      <Overlay color="#000" opacity={0.65} zIndex={1} />

      <div className={classes.inner}>
        <Title className={classes.title}>Pottsville Fire Department</Title>

        <Container size={640}>
          <Stack gap="xl">
            <Text size="lg" className={classes.description}>
              Pottsville Fire & Rescue is an all volunteer fire department that
              serves the citizens of Pottsville and surrounding areas. We
              specialize in fire suppression, extrication, and providing medical
              first responder services.
            </Text>

            <Text size="lg" className={classes.description}>
              We operate out of two stations, Central Station in downtown
              Pottsville and Station 2 on the corner of Day Road and SR 247. We
              currently have a Rescue, two Engines, Two Tanker/Pumpers, and two
              Brush Trucks divided evenly between the stations with extrication
              equipment at both stations.
            </Text>
          </Stack>
        </Container>

        <div className={classes.controls}>
          <Button
            component={Link}
            href="/apply"
            className={classes.control}
            variant="white"
            size="lg"
            color="red.9"
          >
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
