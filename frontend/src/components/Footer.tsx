import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";
import { Flex, Text, Box } from "@radix-ui/themes";
import { ArrowTopRightIcon} from "@radix-ui/react-icons";

export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-stone-800">
      <div className="max-w-6xl mx-auto">
        <Flex direction="column" gap="8">
          {/* Main content */}
          <Flex direction="row" justify="between" align="start" className="flex-wrap gap-8">
            <Box>
              <h3 className="text-2xl font-semibold text-white mb-2">
                <SquigglyUnderlineText>Maatchaa</SquigglyUnderlineText>
              </h3>
              <p className="text-sm text-stone-400">
                Made with love from Waterloo
              </p>
            </Box>

            <Box>
              <Text size="2" className="block text-stone-400 mb-2 font-medium">
                Contact
              </Text>
              <a
                href="mailto:danielpu2007@gmail.com"
                className="text-sm text-stone-300 hover:text-white transition-colors"
              >
                  <span className="flex items-center">Email Us<ArrowTopRightIcon width="12" height="12" className="ml-1" /></span>
              </a>
            </Box>
          </Flex>

          {/* Copyright */}
          <Box className="pt-6 border-t border-stone-700">
            <Text size="1" className="text-stone-500">
              © 2025 Maatchaa. All rights reserved.
            </Text>
          </Box>
        </Flex>
      </div>
    </footer>
  );
}

