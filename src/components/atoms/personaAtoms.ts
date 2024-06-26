import { saveCurrentPersonaId } from "@auth/core";
import { atom, selector } from "recoil";
import { PersonaOverview } from "src";

const uploadDrawerOpenState = atom({
  key: "persona-upload-drawer-open",
  default: false,
});

const detailsDrawerOpenState = atom({
  key: "persona-details-drawer-open",
  default: false,
});

const _internal_currentProjectState = atom({
  key: "project-current-internal",
  default: null as PersonaOverview | null,
});
const currentProjectState = selector({
  key: 'project-current',
  get: ({get}) => {
    const currentProject = get(_internal_currentProjectState);
    currentProject && saveCurrentPersonaId(currentProject.id+'');
    return currentProject;
  },
  set: ({set}, newValue) => {
    if(newValue) {
      saveCurrentPersonaId((newValue as PersonaOverview).id+'');
    } else {
      saveCurrentPersonaId('');
    }
    set(_internal_currentProjectState, newValue);
  }
});

const currentInboxCountState = atom({
  key: "inbox-count",
  default: 0,
});


// NOT USED
// const personaCreationState = atom({
//   key: "persona-creation-data",
//   default: {
//     persona: {
//       active: true,
//       archetype: '',
//       client_id: -1,
//       client_sdr_id: -1,
//       disable_ai_after_prospect_engaged: false,
//       filters: null,
//       id: -1,
//       performance: {
//         status_map: {},
//         total_prospects: -1,
//       },
//       transformer_blocklist: null,
//       uploads: [],
//       icp_matching_prompt: '',
//       is_unassigned_contact_archetype: false,
//       ctas: [],
  
//       fitReason: '',
//       contactObjective: '',
//       fileJSON: [],
//       contract_size: 0,
//     } as ArchetypeCreation,
//     step: 0,
//   },
// });


export {
  uploadDrawerOpenState,
  detailsDrawerOpenState,
  currentProjectState,
  currentInboxCountState,
};
