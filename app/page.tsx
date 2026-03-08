import { HeaderNav } from "./components/navigation/HeaderNav";
import { HeroImageBackground } from "./components/images/hero/HeroImageBackground";
import { Text, Container, Stack } from "@mantine/core";

export default function Home() {
  return (
    <>
      <HeaderNav />

      <HeroImageBackground />

      <Container py="lg">
        <Stack gap="xl">
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
            libero erat, sagittis quis rutrum sed, posuere sed nibh. Curabitur
            vulputate nisl eget urna tincidunt efficitur. Mauris laoreet tellus
            lorem, sodales accumsan mi tincidunt quis. Aenean semper lectus
            mollis, sollicitudin nibh viverra, tempor mi. Suspendisse potenti.
            Sed accumsan ut lectus a dapibus. Curabitur sodales augue eget
            feugiat feugiat. Ut vel finibus dui. Vestibulum sit amet elit ipsum.
            Nam vestibulum tortor ac arcu elementum ultricies. Curabitur metus
            nulla, rutrum eget metus sit amet, sollicitudin iaculis odio.
          </Text>

          <Text>
            Morbi egestas erat mi, vel lobortis nunc maximus non. Nam non congue
            leo, sit amet egestas augue. Duis vitae justo at turpis pellentesque
            ultrices. Praesent urna odio, viverra ut felis nec, accumsan
            eleifend velit. Pellentesque commodo tortor eu cursus ornare. Etiam
            vehicula efficitur sem vel tristique. Pellentesque vestibulum neque
            at elementum elementum.
          </Text>

          <Text>
            Vestibulum blandit eu velit sit amet consequat. Proin ut ipsum et
            dui rutrum sollicitudin. Fusce blandit faucibus ex, rhoncus
            facilisis nulla venenatis sit amet. Etiam congue libero nisi, vitae
            mattis eros congue ut. Integer a ligula elit. Proin justo metus,
            pharetra vitae dolor ac, venenatis pulvinar nunc. Etiam scelerisque,
            tellus eget placerat lacinia, nisl mauris commodo nunc, et ultricies
            tortor sem in sapien. Vestibulum tristique ipsum urna, sed rhoncus
            arcu fermentum ut. Integer semper mollis sagittis.
          </Text>

          <Text>
            Praesent molestie dolor sed neque laoreet mollis. In non maximus
            ligula. Maecenas dictum sit amet odio eget iaculis. Nullam justo
            odio, pharetra ac magna at, pretium sodales arcu. Suspendisse
            lobortis finibus lorem sed dictum. In ornare non massa eget
            lobortis. Proin et congue dolor, ac rutrum nunc. Proin nisi ex,
            cursus eu pretium sit amet, ultrices ut lectus. Morbi porttitor
            tellus et lorem interdum, at venenatis odio vestibulum. Quisque
            volutpat metus eu metus vehicula, pretium vulputate magna gravida.
          </Text>

          <Text>
            Aliquam a tincidunt urna. Suspendisse malesuada ultrices tellus
            vitae molestie. Aenean posuere felis sed sapien mattis, eget egestas
            lectus vestibulum. Maecenas dignissim, velit sollicitudin ultrices
            commodo, erat felis mattis ex, in euismod lectus nisi eu tortor.
            Morbi ultrices egestas ligula id mattis. Mauris sollicitudin at
            justo vitae sagittis. Sed posuere velit nibh, a tincidunt enim
            rutrum in. Maecenas vel ipsum sed nibh tincidunt mattis eu quis
            felis. Pellentesque varius felis purus, quis bibendum nisi pharetra
            ac. Nulla mollis aliquam risus, et sollicitudin arcu maximus non.
            Proin vitae eros laoreet, molestie felis a, luctus massa. Nunc
            maximus vehicula vehicula. In euismod elit et dui cursus aliquet.
            Cras porta convallis tellus finibus eleifend.
          </Text>
        </Stack>
      </Container>
    </>
  );
}
