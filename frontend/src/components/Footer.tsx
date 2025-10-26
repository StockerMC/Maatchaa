import SquigglyUnderlineText from "@/components/SquigglyUnderlineText";
import { Flex, Text, Box } from "@radix-ui/themes";
import { ArrowTopRightIcon} from "@radix-ui/react-icons";

export default function Footer() {
  return (
    <footer className="py-20 pb-28 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Flex direction="column" gap="8">
          {/* Main content */}
          <Flex direction="row" justify="between" align="start" className="flex-wrap gap-8">
            <Box>
              <h3 className="text-2xl font-medium text-gray-900 mb-2">
                Maatchaa
              </h3>
              <p className="text-sm text-gray-600">
                Made with love from Waterloo ❤️
              </p>
            </Box>

            <Box>
              <Text size="2" className="block text-gray-600 mb-2 font-medium">
                Contact
              </Text>
              <a
                href="mailto:danielpu2007@gmail.com"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                  <span className="flex items-center">Email Us<ArrowTopRightIcon width="12" height="12" className="ml-1" /></span>
              </a>
            </Box>
          </Flex>

          {/* Copyright */}
          <Box className="pt-6 border-t border-gray-200">
            <Text size="1" className="text-gray-500">
              © 2025 Maatchaa. All rights reserved.
            </Text>
          </Box>
        </Flex>
      </div>
    </footer>
  );
}

