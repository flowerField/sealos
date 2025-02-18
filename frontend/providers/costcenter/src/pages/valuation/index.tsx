import {
  Box,
  Flex,
  Heading,
  Text,
  Img,
  Stack,
  Table,
  TableContainer,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  ButtonProps,
  Icon
} from '@chakra-ui/react';
import letter_icon from '@/assert/format_letter_spacing_standard_black.svg';
import { QueryClient, dehydrate, useQuery } from '@tanstack/react-query';
import request from '@/service/request';
import { ValuationBillingRecord } from '@/types/valuation';
import { valuationMap } from '@/constants/payment';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { i18n, useTranslation } from 'next-i18next';
import { ApiResp } from '@/types/api';
import nvidaIcon from '@/assert/bi_nvidia.svg';
import { getCookie } from '@/utils/cookieUtils';
import { CYCLE } from '@/constants/valuation';
import PredictCard from '@/components/valuation/predictCard';
import useEnvStore from '@/stores/env';
import CurrencySymbol from '@/components/CurrencySymbol';
import Quota from '@/components/valuation/quota';
import ListIcon from '@/components/icons/ListIcon';
import CpuIcon from '@/components/icons/CpuIcon';
import { MemoryIcon } from '@/components/icons/MemoryIcon';
import { NetworkIcon } from '@/components/icons/NetworkIcon';
import { StorageIcon } from '@/components/icons/StorageIcon';
type CardItem = {
  title: string;
  price: number[];
  unit: string;
  bg: string;
  idx: number;
  icon: typeof Icon;
};

const getValuation = () =>
  request<any, ApiResp<{ billingRecords: ValuationBillingRecord[] }>>('/api/price');

function CycleMenu({
  cycleIdx,
  setCycleIdx,
  ...props
}: {
  cycleIdx: number;
  setCycleIdx: (x: number) => void;
} & ButtonProps) {
  const { t } = useTranslation();
  return (
    <Flex align={'center'} ml="28px">
      <Popover>
        <PopoverTrigger>
          <Button
            w="110px"
            h="32px"
            fontStyle="normal"
            fontWeight="400"
            fontSize="12px"
            lineHeight="140%"
            border={'1px solid #DEE0E2'}
            bg={'#F6F8F9'}
            _expanded={{
              background: '#F8FAFB',
              border: `1px solid #36ADEF`
            }}
            _hover={{
              background: '#F8FAFB',
              border: `1px solid #36ADEF`
            }}
            borderRadius={'2px'}
            {...props}
          >
            {t(CYCLE[cycleIdx])}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          p={'6px'}
          boxSizing="border-box"
          w={'110px'}
          shadow={'0px 0px 1px 0px #798D9F40, 0px 2px 4px 0px #A1A7B340'}
          border={'none'}
        >
          {CYCLE.map((v, idx) => (
            <Button
              key={v}
              {...(idx === cycleIdx
                ? {
                    color: '#0884DD',
                    bg: '#F4F6F8'
                  }
                : {
                    color: '#5A646E',
                    bg: '#FDFDFE'
                  })}
              h="30px"
              fontFamily="PingFang SC"
              fontSize="12px"
              fontWeight="400"
              lineHeight="18px"
              p={'0'}
              onClick={() => {
                setCycleIdx(idx);
              }}
            >
              {t(v)}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
function Valuation() {
  const { t, i18n } = useTranslation();
  const cookie = getCookie('NEXT_LOCALE');
  const gpuEnabled = useEnvStore((state) => state.gpuEnabled);
  const [cycleIdx, setCycleIdx] = useState(0);
  const currency = useEnvStore((s) => s.currency);
  useEffect(() => {
    i18n.changeLanguage(cookie);
  }, [cookie, i18n]);
  const { data: _data } = useQuery(['valuation'], getValuation);

  const data =
    _data?.data?.billingRecords
      ?.filter((x) => !x.resourceType.startsWith('gpu-'))
      ?.flatMap<CardItem>((x) => {
        const props = valuationMap.get(x.resourceType);
        if (!props) return [];
        let icon;
        if (x.resourceType === 'cpu') icon = CpuIcon;
        else if (x.resourceType === 'memory') icon = MemoryIcon;
        else if (x.resourceType === 'network') icon = NetworkIcon;
        else if (x.resourceType === 'storage') icon = StorageIcon;
        else return [];
        return [
          {
            title: x.resourceType,
            price: [1, 24, 168, 720, 8760].map(
              (v) => Math.floor(v * x.price * (props.scale || 1)) / 1000000
            ),
            unit: props.unit,
            bg: props.bg,
            idx: props.idx,
            icon
          }
        ];
      })
      ?.sort((a, b) => a.idx - b.idx) || [];
  const gpuProps = valuationMap.get('gpu')!;
  const gpuData = gpuEnabled
    ? _data?.data?.billingRecords
        ?.filter((x) => x.resourceType.startsWith('gpu-'))
        ?.map((x) => {
          const name = x.resourceType.replace('gpu-', '').replace('_', ' ');
          const price = (x.price * (gpuProps.scale || 1)) / 1000000;
          return {
            name,
            price
          };
        })
        ?.sort((a, b) => (a.name > b.name ? 1 : -1)) || []
    : [];
  return (
    <Flex w="100%" h="100%">
      <Stack
        flex={1}
        bg={'#FBFBFC'}
        alignItems="center"
        p={'24px'}
        borderRadius={'4px'}
        overflowY={'auto'}
      >
        <Flex alignSelf={'flex-start'} mb="30px" align={'center'}>
          <Img src={letter_icon.src} w={'24px'} h={'24px'} mr={'18px'}></Img>
          <Heading size="lg">{t('Valuation.Standard')}</Heading>
        </Flex>
        <Flex direction={'column'} w="full">
          <Box w="full" px="100px">
            <Flex w="full" justifyContent={'flex-end'} mb="20px" align={'center'}>
              <ListIcon w="24px" h="24px" mr="6px" />
              <Text mr="auto">{t('common valuation')}</Text>
              <Text>{t('Unit')}</Text>
              <CycleMenu cycleIdx={cycleIdx} setCycleIdx={setCycleIdx} ml="auto" />
            </Flex>
            <TableContainer w="100%" mt="0px">
              <Table variant="unstyled">
                <Thead border="1px solid #DEE0E2" overflow={'hidden'}>
                  <Tr borderRadius={'10px'}>
                    {['Name', 'Unit', 'Price'].map((item) => (
                      <Th px="24px" pt="12px" pb="14px" w="200px" background="#F1F4F6" key={item}>
                        <Flex display={'flex'} alignItems={'center'}>
                          <Text mr="4px">{t(item)}</Text>
                          {['Price'].includes(item) && <CurrencySymbol type={currency} />}
                        </Flex>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((x) => (
                    <Tr border="1px solid #DEE0E2" key={x.title}>
                      <Td display={'flex'} alignItems={'center'} border={'none'}>
                        <x.icon h="16px" w="16px" mr="8px" />
                        <Text textTransform={'capitalize'} textAlign={'center'}>
                          {t(x.title)}
                        </Text>
                      </Td>
                      <Td>{x.unit + (x.title !== 'network' ? `/${t(CYCLE[cycleIdx])}` : '')}</Td>
                      <Td>{x.title === 'network' ? x.price[0] : x.price[cycleIdx]}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
          {gpuEnabled && gpuData.length > 0 && (
            <Box w="full" px="100px" mt="48px">
              <Flex w="full" justifyContent={'flex-end'} mb="20px" align={'center'}>
                <ListIcon w="24px" h="24px" mr="6px" />
                <Text mr="auto">{t('Gpu valuation')}</Text>
              </Flex>
              <TableContainer w="100%" mt="0px">
                <Table variant="simple">
                  <Thead background="#F1F4F6" border="1px solid #DEE0E2">
                    <Tr>
                      {['Name', 'Unit', 'Price'].map((item) => (
                        <Th key={item} bg={'#F1F4F6'} px="24px" pt="12px" pb="14px" w={'200px'}>
                          <Flex display={'flex'} alignItems={'center'}>
                            <Text mr="4px">{t(item)}</Text>
                            {['Price'].includes(item) && <CurrencySymbol type={currency} />}
                          </Flex>
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {gpuData.map((x) => (
                      <Tr border="1px solid #DEE0E2" key={x.name}>
                        <Td display={'flex'} alignItems={'center'} border={'none'}>
                          <Img src={nvidaIcon.src} w="16px" h="16px" mr="8px" />
                          <Text>{t(x.name)}</Text>
                        </Td>
                        <Td>
                          {t('GPU Unit')}/{t('Hour')}
                        </Td>
                        <Td>{x.price}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Flex>
      </Stack>
      <Stack ml="8px" w="280px" gap="8px">
        <Stack
          w="280px"
          h="250px"
          minH={'100px'}
          overflow={'auto'}
          borderRadius="4px"
          background="#FBFBFC"
        >
          <Text py={'24px'} px={'24px'} mr="6px" borderBottom={'solid 1px #DEE0E2'}>
            {t('Source Quota')}
          </Text>
          <Stack px="24px" flex={1} justify={'center'}>
            <Quota />
          </Stack>
        </Stack>
        <Stack
          w="280px"
          h="320px"
          minH={'100px'}
          overflow={'auto'}
          borderRadius="4px"
          background="#FBFBFC"
        >
          <Flex align={'center'} px={'24px'} py="24px" mr="6px" borderBottom={'solid 1px #DEE0E2'}>
            <Text mr={'17px '}>
              {t('Next month cost estimation')}({t('Predict Detail')})
            </Text>
          </Flex>
          <Stack pl="24px" flex={1} justify={'center'}>
            <PredictCard />
          </Stack>
        </Stack>
      </Stack>
    </Flex>
  );
}
export default Valuation;
export async function getServerSideProps(content: any) {
  const locale = content?.req?.cookies?.NEXT_LOCALE || 'zh';
  process.env.NODE_ENV === 'development' && i18n?.reloadResources(locale, undefined);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(['valuation'], getValuation);
  return {
    props: {
      ...(await serverSideTranslations(locale, undefined, null, content.locales)),

      dehydratedState: dehydrate(queryClient)
    }
  };
}
