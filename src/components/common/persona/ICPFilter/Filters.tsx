import { useEffect, useState } from 'react';
import {
  InputBase,
  Box,
  Title,
  Select,
  Tabs,
  Button,
  Flex,
  Progress,
  NumberInput,
  Center,
  Text,
} from '@mantine/core';
import CustomSelect from './CustomSelect';
import { IconBuildingCommunity, IconPhoto, IconUser } from '@tabler/icons';
import { useForm } from '@mantine/form';
import { set } from 'lodash';
import { useRecoilState, useRecoilValue } from 'recoil';
import { filterProspectsState, filterRuleSetState } from '@atoms/icpFilterAtoms';
import { getICPRuleSet, updateICPFiltersBySalesNavURL } from '@utils/requests/icpScoring';
import { userTokenState } from '@atoms/userAtoms';
import { currentProjectState } from '@atoms/personaAtoms';
import { getFiltersAutofill } from '@utils/requests/getFiltersAutofill';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';

function Filters(props: {
  isTesting: boolean;
  selectOptions: { value: string; label: string }[];
  autofill: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const userToken = useRecoilValue(userTokenState);
  const currentProject = useRecoilValue(currentProjectState);
  const [globalRuleSetData, setGlobalRuleSetData] = useRecoilState(filterRuleSetState);
  const icpProspects = useRecoilValue(filterProspectsState);

  const [included_individual_title_keywords, setIncludedIndividualTitleKeywords] = useState<
    string[]
  >([]);
  const [excluded_individual_title_keywords, setExcludedIndividualTitleKeywords] = useState<
    string[]
  >([]);
  const [included_individual_industry_keywords, setIncludedIndividualIndustryKeywords] = useState<
    string[]
  >([]);
  const [excluded_individual_industry_keywords, setExcludedIndividualIndustryKeywords] = useState<
    string[]
  >([]);
  const [individual_years_of_experience_start, setIndividualYearsOfExperienceStart] =
    useState<number>(0);
  const [individual_years_of_experience_end, setIndividualYearsOfExperienceEnd] =
    useState<number>(0);
  const [included_individual_skills_keywords, setIncludedIndividualSkillsKeywords] = useState<
    string[]
  >([]);
  const [excluded_individual_skills_keywords, setExcludedIndividualSkillsKeywords] = useState<
    string[]
  >([]);
  const [included_individual_locations_keywords, setIncludedIndividualLocationsKeywords] = useState<
    string[]
  >([]);
  const [excluded_individual_locations_keywords, setExcludedIndividualLocationsKeywords] = useState<
    string[]
  >([]);
  const [included_individual_generalized_keywords, setIncludedIndividualGeneralizedKeywords] =
    useState<string[]>([]);
  const [excluded_individual_generalized_keywords, setExcludedIndividualGeneralizedKeywords] =
    useState<string[]>([]);
  const [included_individual_education_keywords, setIncludedIndividualEducationKeywords] = useState<
    string[]
  >([]);
  const [excluded_individual_education_keywords, setExcludedIndividualEducationKeywords] = useState<
    string[]
  >([]);
  const [included_company_name_keywords, setIncludedCompanyNameKeywords] = useState<string[]>([]);
  const [excluded_company_name_keywords, setExcludedCompanyNameKeywords] = useState<string[]>([]);
  const [included_company_locations_keywords, setIncludedCompanyLocationsKeywords] = useState<
    string[]
  >([]);
  const [excluded_company_locations_keywords, setExcludedCompanyLocationsKeywords] = useState<
    string[]
  >([]);
  const [company_size_start, setCompanySizeStart] = useState<number>(0);
  const [company_size_end, setCompanySizeEnd] = useState<number>(0);
  const [included_company_industries_keywords, setIncludedCompanyIndustriesKeywords] = useState<
    string[]
  >([]);
  const [excluded_company_industries_keywords, setExcludedCompanyIndustriesKeywords] = useState<
    string[]
  >([]);
  const [included_company_generalized_keywords, setIncludedCompanyGeneralizedKeywords] = useState<
    string[]
  >([]);
  const [excluded_company_generalized_keywords, setExcludedCompanyGeneralizedKeywords] = useState<
    string[]
  >([]);

  useQuery({
    queryKey: [`get-icp-filters`, { currentProject }],
    queryFn: async ({ queryKey }) => {
      // @ts-ignore
      // eslint-disable-next-line
      const [_key, { currentProject }] = queryKey;

      if (!currentProject) return null;

      const response = await getICPRuleSet(userToken, currentProject.id);

      if (response.status === 'success') {
        setIncludedIndividualTitleKeywords(response.data.included_individual_title_keywords ?? []);
        setExcludedIndividualTitleKeywords(response.data.excluded_individual_title_keywords ?? []);
        setIncludedIndividualIndustryKeywords(
          response.data.included_individual_industry_keywords ?? []
        );
        setExcludedIndividualIndustryKeywords(
          response.data.excluded_individual_industry_keywords ?? []
        );
        setIndividualYearsOfExperienceStart(
          response.data.individual_years_of_experience_start ?? 0
        );
        setIndividualYearsOfExperienceEnd(response.data.individual_years_of_experience_end ?? 0);
        setIncludedIndividualSkillsKeywords(
          response.data.included_individual_skills_keywords ?? []
        );
        setExcludedIndividualSkillsKeywords(
          response.data.excluded_individual_skills_keywords ?? []
        );
        setIncludedIndividualLocationsKeywords(
          response.data.included_individual_locations_keywords ?? []
        );
        setExcludedIndividualLocationsKeywords(
          response.data.excluded_individual_locations_keywords ?? []
        );
        setIncludedIndividualGeneralizedKeywords(
          response.data.included_individual_generalized_keywords ?? []
        );
        setExcludedIndividualGeneralizedKeywords(
          response.data.excluded_individual_generalized_keywords ?? []
        );
        setIncludedIndividualEducationKeywords(
          response.data.included_individual_education_keywords ?? []
        );
        setExcludedIndividualEducationKeywords(
          response.data.excluded_individual_education_keywords ?? []
        );
        setIncludedCompanyNameKeywords(response.data.included_company_name_keywords ?? []);
        setExcludedCompanyNameKeywords(response.data.excluded_company_name_keywords ?? []);
        setIncludedCompanyLocationsKeywords(
          response.data.included_company_locations_keywords ?? []
        );
        setExcludedCompanyLocationsKeywords(
          response.data.excluded_company_locations_keywords ?? []
        );
        setCompanySizeStart(response.data.company_size_start ?? 0);
        setCompanySizeEnd(response.data.company_size_end ?? 0);
        setIncludedCompanyIndustriesKeywords(
          response.data.included_company_industries_keywords ?? []
        );
        setExcludedCompanyIndustriesKeywords(
          response.data.excluded_company_industries_keywords ?? []
        );
        setIncludedCompanyGeneralizedKeywords(
          response.data.included_company_generalized_keywords ?? []
        );
        setExcludedCompanyGeneralizedKeywords(
          response.data.excluded_company_generalized_keywords ?? []
        );
      }
      return null;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setGlobalRuleSetData({
      included_individual_title_keywords,
      excluded_individual_title_keywords,
      included_individual_industry_keywords,
      excluded_individual_industry_keywords,
      individual_years_of_experience_start,
      individual_years_of_experience_end,
      included_individual_skills_keywords,
      excluded_individual_skills_keywords,
      included_individual_locations_keywords,
      excluded_individual_locations_keywords,
      included_individual_generalized_keywords,
      excluded_individual_generalized_keywords,
      included_company_name_keywords,
      excluded_company_name_keywords,
      included_company_locations_keywords,
      excluded_company_locations_keywords,
      company_size_start,
      company_size_end,
      included_company_industries_keywords,
      excluded_company_industries_keywords,
      included_company_generalized_keywords,
      excluded_company_generalized_keywords,
      included_individual_education_keywords,
      excluded_individual_education_keywords,
    });
  }, [
    included_individual_title_keywords,
    excluded_individual_title_keywords,
    included_individual_industry_keywords,
    excluded_individual_industry_keywords,
    individual_years_of_experience_start,
    individual_years_of_experience_end,
    included_individual_skills_keywords,
    excluded_individual_skills_keywords,
    included_individual_locations_keywords,
    excluded_individual_locations_keywords,
    included_individual_generalized_keywords,
    excluded_individual_generalized_keywords,
    included_company_name_keywords,
    excluded_company_name_keywords,
    included_company_locations_keywords,
    excluded_company_locations_keywords,
    company_size_start,
    company_size_end,
    included_company_industries_keywords,
    excluded_company_industries_keywords,
    included_company_generalized_keywords,
    excluded_company_generalized_keywords,
    included_individual_education_keywords,
    excluded_individual_education_keywords,
  ]);

  const titleOptions = [...new Set(icpProspects.map((x) => (x.title ? x.title : '')))].filter(
    (x) => x
  );
  const industryOptions = [...new Set(icpProspects.map((x) => x.industry))].filter((x) => x);
  const companyOptions = [...new Set(icpProspects.map((x) => x.company))].filter((x) => x);

  return (
    <>
      <Tabs
        defaultValue='personal'
        styles={(theme) => ({
          tabsList: {
            backgroundColor: theme.colors.blue[theme.fn.primaryShade()],
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
            height: '44px',
          },
          panel: {
            padding: '0.5rem',
          },
          tab: {
            ...theme.fn.focusStyles(),
            color: theme.white,
            marginBottom: 0,
            '&:hover': {
              backgroundColor: theme.colors.blue[theme.fn.primaryShade()],
              color: theme.white,
            },
            '&[data-active]': {
              borderBottomColor: theme.white,
              color: theme.white,
            },
          },
        })}
      >
        <Tabs.List>
          <Tabs.Tab value='personal'>Person</Tabs.Tab>
          <Tabs.Tab value='company'>Company</Tabs.Tab>
        </Tabs.List>

        <Box
          sx={{
            maxHeight: '50vh',
            overflowY: 'scroll',
            paddingBottom: '1rem',
          }}
        >
          <Tabs.Panel value='personal'>
            <Box
              style={{
                display: 'flex',
                gap: '1rem',
                flexDirection: 'column',
              }}
            >
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_title_keywords}
                label='Titles (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualTitleKeywords}
                data={included_individual_title_keywords.concat(titleOptions)}
                setData={setIncludedIndividualTitleKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_title_keywords}
                label='Titles (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualTitleKeywords}
                data={excluded_individual_title_keywords.concat(titleOptions)}
                setData={setExcludedIndividualTitleKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_industry_keywords}
                label='Industry Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualIndustryKeywords}
                data={included_individual_industry_keywords.concat(industryOptions)}
                setData={setIncludedIndividualIndustryKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_industry_keywords}
                label='Industry Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualIndustryKeywords}
                data={excluded_individual_industry_keywords.concat(industryOptions)}
                setData={setExcludedIndividualIndustryKeywords}
              />
              <Flex direction='column'>
                <Title size={'14px'} fw={'500'}>
                  Years of Experience
                </Title>
                <Flex
                  justify={'space-between'}
                  align={'center'}
                  mt={'0.2rem'}
                  w={'100%'}
                  gap={'xs'}
                  maw={'30vw'}
                >
                  <NumberInput
                    value={individual_years_of_experience_start}
                    placeholder='Min'
                    hideControls
                    onChange={(value) => setIndividualYearsOfExperienceStart(value || 0)}
                  />
                  <NumberInput
                    value={individual_years_of_experience_end}
                    placeholder='Max'
                    hideControls
                    onChange={(value) => setIndividualYearsOfExperienceEnd(value || 0)}
                  />
                </Flex>
                <Button
                  mt={'0.5rem'}
                  size='sm'
                  ml={'auto'}
                  onClick={() => setIndividualYearsOfExperienceEnd(100)}
                >
                  Max
                </Button>
              </Flex>
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_skills_keywords}
                label='Skills Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualSkillsKeywords}
                data={included_individual_skills_keywords}
                setData={setIncludedIndividualSkillsKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_skills_keywords}
                label='Skills Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualSkillsKeywords}
                data={excluded_individual_skills_keywords}
                setData={setExcludedIndividualSkillsKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_locations_keywords}
                label='Location Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualLocationsKeywords}
                data={included_individual_locations_keywords.concat(['United States'])}
                setData={setIncludedIndividualLocationsKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_locations_keywords}
                label='Location Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualLocationsKeywords}
                data={excluded_individual_locations_keywords.concat(['United States'])}
                setData={setExcludedIndividualLocationsKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_generalized_keywords}
                label='Bio & Jobs Description (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualGeneralizedKeywords}
                data={included_individual_generalized_keywords}
                setData={setIncludedIndividualGeneralizedKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_generalized_keywords}
                label='Bio & Jobs Description (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualGeneralizedKeywords}
                data={excluded_individual_generalized_keywords}
                setData={setExcludedIndividualGeneralizedKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_individual_education_keywords}
                label='University / College (Included)'
                placeholder='Select options'
                setValue={setIncludedIndividualEducationKeywords}
                data={included_individual_education_keywords}
                setData={setIncludedIndividualEducationKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_individual_education_keywords}
                label='University / College (Excluded)'
                placeholder='Select options'
                setValue={setExcludedIndividualEducationKeywords}
                data={excluded_individual_education_keywords}
                setData={setExcludedIndividualEducationKeywords}
              />
            </Box>
          </Tabs.Panel>
          <Tabs.Panel value='company'>
            <Box style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <CustomSelect
                maxWidth='30vw'
                value={included_company_name_keywords}
                label='Companies Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedCompanyNameKeywords}
                data={included_company_name_keywords.concat(companyOptions)}
                setData={setIncludedCompanyNameKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_company_name_keywords}
                label='Companies Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedCompanyNameKeywords}
                data={excluded_company_name_keywords.concat(companyOptions)}
                setData={setExcludedCompanyNameKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_company_locations_keywords}
                label='Location Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedCompanyLocationsKeywords}
                data={included_company_locations_keywords.concat(['United States'])}
                setData={setIncludedCompanyLocationsKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_company_locations_keywords}
                label='Location Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedCompanyLocationsKeywords}
                data={excluded_company_locations_keywords.concat(['United States'])}
                setData={setExcludedCompanyLocationsKeywords}
              />
              <Flex direction='column' maw={'30vw'}>
                <Title size={'14px'} fw={'500'}>
                  Employee Count
                </Title>
                <Box
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'center',
                    marginTop: '0.2rem',
                  }}
                >
                  <NumberInput
                    value={company_size_start}
                    placeholder='Min'
                    hideControls
                    onChange={(value) => setCompanySizeStart(value || 0)}
                  />
                  <NumberInput
                    value={company_size_end}
                    placeholder='Max'
                    hideControls
                    onChange={(value) => setCompanySizeEnd(value || 0)}
                  />
                </Box>
                <Button
                  mt={'0.5rem'}
                  size='sm'
                  ml={'auto'}
                  onClick={() => setCompanySizeEnd(100_000)}
                >
                  Max
                </Button>
              </Flex>
              <CustomSelect
                maxWidth='30vw'
                value={included_company_industries_keywords}
                label='Industries Keywords (Included)'
                placeholder='Select options'
                setValue={setIncludedCompanyIndustriesKeywords}
                data={included_company_industries_keywords.concat(industryOptions)}
                setData={setIncludedCompanyIndustriesKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_company_industries_keywords}
                label='Industries Keywords (Excluded)'
                placeholder='Select options'
                setValue={setExcludedCompanyIndustriesKeywords}
                data={excluded_company_industries_keywords.concat(industryOptions)}
                setData={setExcludedCompanyIndustriesKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={included_company_generalized_keywords}
                label='Company Description (Included)'
                placeholder='Select options'
                setValue={setIncludedCompanyGeneralizedKeywords}
                data={included_company_generalized_keywords}
                setData={setIncludedCompanyGeneralizedKeywords}
              />
              <CustomSelect
                maxWidth='30vw'
                value={excluded_company_generalized_keywords}
                label='Company Description (Excluded)'
                placeholder='Select options'
                setValue={setExcludedCompanyGeneralizedKeywords}
                data={excluded_company_generalized_keywords}
                setData={setExcludedCompanyGeneralizedKeywords}
              />
            </Box>
          </Tabs.Panel>
        </Box>
      </Tabs>
      {props.autofill && (
        <Center>
          <Button
            mt='xs'
            variant='light'
            loading={loading}
            onClick={async () => {
              openConfirmModal({
                title: 'Override existing filters?',
                children: (
                  <Text>
                    Are you sure you want to override existing filters? This action cannot be
                    undone.
                  </Text>
                ),
                labels: { confirm: 'Confirm', cancel: 'Cancel' },
                onCancel: () => {},
                onConfirm: () => {
                  (async () => {
                    if (!currentProject) return;
                    setLoading(true);
                    const response = await getFiltersAutofill(userToken, currentProject.id);
                    const results = response.data;
                    console.log(results);
                    setIncludedIndividualTitleKeywords(results.job_titles);
                    setIncludedIndividualIndustryKeywords(results.industries);
                    setCompanySizeStart(results.yoe.min);
                    setCompanySizeEnd(results.yoe.max);
                    setLoading(false);

                    showNotification({
                      title: 'Filters autofilled',
                      message: 'Filters have been autofilled based on your prospects',
                    });
                  })();
                },
              });
            }}
          >
            AI Autofill
          </Button>
          <Button
            onClick={async () => {
              openContextModal({
                modal: 'salesNavURL',
                title: 'Import Filters from Sales Nav URL',
                innerProps: {},
              });
            }}
            size='xs'
            compact
          >
            Import from Sales Nav URL
          </Button>
        </Center>
      )}
    </>
  );
}

export default Filters;
