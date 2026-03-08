"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  Alert,
  Button,
  Divider,
  Grid,
  Radio,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export function ApplyForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const form = useForm({
    initialValues: {
      // Personal Information
      lastName: "",
      firstName: "",
      middleInitial: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZip: "",
      dateOfBirth: "",
      age: "",
      ssn: "",
      dlNumber: "",
      dlState: "",
      dlExpiration: "",
      phone: "",
      email: "",
      // Previous Service
      previousMember: "",
      serviceType: "",
      serviceFrom: "",
      serviceTo: "",
      fireChiefName: "",
      deptAddress: "",
      reasonForLeaving: "",
      trainingSkills: "",
      trainingRecordsAvailable: "",
      // References
      ref1Name: "",
      ref1Phone: "",
      ref1Email: "",
      ref2Name: "",
      ref2Phone: "",
      ref2Email: "",
      ref3Name: "",
      ref3Phone: "",
      ref3Email: "",
      // Background
      felonyConviction: "",
      felonyExplanation: "",
      // Signature
      signature: "",
      signatureDate: "",
    },
    validate: {
      firstName: (v) => (v.trim().length < 2 ? "Required" : null),
      lastName: (v) => (v.trim().length < 2 ? "Required" : null),
      addressStreet: (v) => (v.trim().length < 2 ? "Required" : null),
      addressCity: (v) => (v.trim().length < 2 ? "Required" : null),
      addressState: (v) => (v ? null : "Required"),
      addressZip: (v) => (/^\d{5}(-\d{4})?$/.test(v) ? null : "Enter a valid ZIP code"),
      dateOfBirth: (v) => (v ? null : "Required"),
      age: (v) => (/^\d+$/.test(v) ? null : "Required"),
      ssn: (v) => (/^\d{3}-?\d{2}-?\d{4}$/.test(v) ? null : "Enter a valid SSN"),
      dlNumber: (v) => (v.trim().length < 2 ? "Required" : null),
      dlState: (v) => (v ? null : "Required"),
      dlExpiration: (v) => (v ? null : "Required"),
      phone: (v) => (v.trim().length < 2 ? "Required" : null),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
      previousMember: (v) => (v ? null : "Required"),
      serviceFrom: (v, values) => (values.previousMember === "yes" && !v.trim() ? "Required" : null),
      serviceTo: (v, values) => (values.previousMember === "yes" && !v.trim() ? "Required" : null),
      fireChiefName: (v, values) => (values.previousMember === "yes" && v.trim().length < 2 ? "Required" : null),
      deptAddress: (v, values) => (values.previousMember === "yes" && v.trim().length < 2 ? "Required" : null),
      reasonForLeaving: (v, values) => (values.previousMember === "yes" && v.trim().length < 2 ? "Required" : null),
      trainingRecordsAvailable: (v) => (v ? null : "Required"),
      ref1Name: (v) => (v.trim().length < 2 ? "Required" : null),
      ref1Phone: (v) => (v.trim().length < 2 ? "Required" : null),
      ref1Email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
      ref2Name: (v) => (v.trim().length < 2 ? "Required" : null),
      ref2Phone: (v) => (v.trim().length < 2 ? "Required" : null),
      ref2Email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
      ref3Name: (v) => (v.trim().length < 2 ? "Required" : null),
      ref3Phone: (v) => (v.trim().length < 2 ? "Required" : null),
      ref3Email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address"),
      felonyConviction: (v) => (v ? null : "Required"),
      felonyExplanation: (v, values) => (values.felonyConviction === "yes" && v.trim().length < 2 ? "Required" : null),
      signature: (v) => (v.trim().length < 2 ? "Required" : null),
      signatureDate: (v) => (v ? null : "Required"),
    },
  });

  const wasPreviousMember = form.values.previousMember === "yes";
  const hasFelony = form.values.felonyConviction === "yes";
  const fullName = form.values.signature.trim() ||
    [form.values.firstName, form.values.middleInitial, form.values.lastName].filter(Boolean).join(" ") ||
    "_______________";

  async function handleSubmit(values: typeof form.values) {
    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "department-application", ...values }),
      });
      setSubmitted(true);
    } catch {
      setError(true);
    }
  }

  if (submitted) {
    return (
      <Alert color="green" title="Application received">
        Thanks, {form.values.firstName}! We&apos;ll be in touch at {form.values.email}.
      </Alert>
    );
  }

  return (
    <form
      // @ts-expect-error netlify prop needed for form submissions without JavaScript
      netlify
      name="department-application"
      onSubmit={form.onSubmit(handleSubmit)}
      data-netlify="true"
    >
      <input type="hidden" name="form-name" value="department-application" />

      <Stack gap="xl">
        {error && (
          <Alert color="red" title="Submission failed">
            <Text size="sm">
              Something went wrong. Please try again or contact us directly.
            </Text>
          </Alert>
        )}

        {/* Personal Information */}
        <Stack gap="md">
          <Title order={3}>Personal Information</Title>
          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput label="Last name" required {...form.getInputProps("lastName")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput label="First name" required {...form.getInputProps("firstName")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2 }}>
              <TextInput label="MI" maxLength={1} {...form.getInputProps("middleInitial")} />
            </Grid.Col>
          </Grid>

          <TextInput label="Street / Route" placeholder="123 Main St" required {...form.getInputProps("addressStreet")} />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput label="City" required {...form.getInputProps("addressCity")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select label="State" data={US_STATES} searchable required {...form.getInputProps("addressState")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="ZIP code" placeholder="72858" required {...form.getInputProps("addressZip")} />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="Date of birth" placeholder="MM/DD/YYYY" required {...form.getInputProps("dateOfBirth")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2 }}>
              <TextInput label="Age" placeholder="30" required {...form.getInputProps("age")} />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label="Social Security Number" placeholder="XXX-XX-XXXX" required {...form.getInputProps("ssn")} />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="Driver's License #" required {...form.getInputProps("dlNumber")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select label="DL State" data={US_STATES} searchable required {...form.getInputProps("dlState")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="DL Expiration" placeholder="MM/DD/YYYY" required {...form.getInputProps("dlExpiration")} />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="Phone number" placeholder="555-555-5555" required {...form.getInputProps("phone")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label="Email address" placeholder="jane@example.com" required {...form.getInputProps("email")} />
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Previous Service */}
        <Stack gap="md">
          <Title order={3}>Previous Service</Title>
          <Divider />

          <Radio.Group label="Have you been a member of a fire department?" required {...form.getInputProps("previousMember")}>
            <Stack gap="xs" mt="xs">
              <Radio value="yes" label="Yes" />
              <Radio value="no" label="No" />
            </Stack>
          </Radio.Group>

          {wasPreviousMember && (
            <Stack gap="md">
              <Radio.Group label="Type of service" required {...form.getInputProps("serviceType")}>
                <Stack gap="xs" mt="xs">
                  <Radio value="paid" label="Paid" />
                  <Radio value="volunteer" label="Volunteer" />
                </Stack>
              </Radio.Group>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput label="Date of service (from)" placeholder="MM/YYYY" required {...form.getInputProps("serviceFrom")} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput label="Date of service (to)" placeholder="MM/YYYY" required {...form.getInputProps("serviceTo")} />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label="Name of fire chief" required {...form.getInputProps("fireChiefName")} />
                </Grid.Col>
              </Grid>

              <TextInput label="Address of department" required {...form.getInputProps("deptAddress")} />

              <Textarea label="Reason for leaving" autosize minRows={3} required {...form.getInputProps("reasonForLeaving")} />
            </Stack>
          )}

          <Textarea
            label="List all training and/or special skills beneficial to the department"
            autosize
            minRows={4}
            {...form.getInputProps("trainingSkills")}
          />

          <Radio.Group label="Are your training records available?" required {...form.getInputProps("trainingRecordsAvailable")}>
            <Stack gap="xs" mt="xs">
              <Radio value="yes" label="Yes" />
              <Radio value="no" label="No" />
            </Stack>
          </Radio.Group>
        </Stack>

        {/* References */}
        <Stack gap="md">
          <Title order={3}>References</Title>
          <Divider />
          <Text size="sm" c="dimmed">Please provide three references with telephone numbers.</Text>

          {([1, 2, 3] as const).map((n) => (
            <Stack key={n} gap="sm">
              <Text fw={500} size="sm">Reference {n}</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 5 }}>
                  <TextInput
                    label="Name"
                    required
                    {...form.getInputProps(`ref${n}Name`)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="Phone number"
                    placeholder="555-555-5555"
                    required
                    {...form.getInputProps(`ref${n}Phone`)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <TextInput
                    label="Email"
                    placeholder="optional"
                    {...form.getInputProps(`ref${n}Email`)}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          ))}
        </Stack>

        {/* Background */}
        <Stack gap="md">
          <Title order={3}>Background</Title>
          <Divider />

          <Radio.Group label="Have you ever been convicted of a felony?" required {...form.getInputProps("felonyConviction")}>
            <Stack gap="xs" mt="xs">
              <Radio value="yes" label="Yes" />
              <Radio value="no" label="No" />
            </Stack>
          </Radio.Group>

          {hasFelony && (
            <Stack gap="xs">
              <Textarea
                label="Please explain"
                autosize
                minRows={4}
                required
                {...form.getInputProps("felonyExplanation")}
              />
              <Alert variant="light" color="gray">
                <Text size="sm">
                  If you answer yes, this does not mean your application will be rejected.
                  Department officers will review applicants with a felony history independently
                  and confidentially before being considered by members.
                </Text>
              </Alert>
            </Stack>
          )}
        </Stack>

        {/* Signature */}
        <Stack gap="md">
          <Title order={3}>Signature</Title>
          <Divider />

          <Text size="sm">
            I, <Text component="span" fw={600}>{fullName}</Text>, give my permission
            to the Pottsville Fire Department to perform a criminal background check
            with local and state law enforcement. I attest that the information I have
            provided in this application is true, and I understand that should it be
            determined at a later date that I have falsified any information on this
            application, it will be grounds for immediate dismissal from the Department.
          </Text>

          <Text size="xs" c="dimmed">Type your full name below to sign electronically.</Text>

          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Signature"
                placeholder="Full name"
                required
                styles={{ input: { fontFamily: "cursive", fontSize: "1.1rem" } }}
                {...form.getInputProps("signature")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput
                label="Date"
                placeholder="MM/DD/YYYY"
                required
                {...form.getInputProps("signatureDate")}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        <Button type="submit" color="red.9" disabled={!form.isDirty() || !form.isValid()}>
          Submit application
        </Button>
      </Stack>
    </form>
  );
}
