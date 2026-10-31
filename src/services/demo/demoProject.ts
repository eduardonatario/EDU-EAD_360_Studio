/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bathroomPano from '../../assets/images/modern_bathroom_spa_1793417469297.jpg';
import bedroomPano from '../../assets/images/modern_bedroom_suite_1793417468751.jpg';
import kitchenPano from '../../assets/images/modern_kitchen_gourmet_1793417468857.jpg';
import livingPano from '../../assets/images/modern_living_room_1793417467833.jpg';
import { TourProject } from '../../types/tour';
import { generateEducationalCardImage } from './panoramaGenerator';

export function createModernHouseDemoProject(): TourProject {
  const bioclimaticImg = generateEducationalCardImage('bioclimatic');
  const lightingImg = generateEducationalCardImage('lighting');
  const materialsImg = generateEducationalCardImage('materials');
  const acousticsImg = generateEducationalCardImage('acoustics');
  const spaImg = generateEducationalCardImage('spa');

  return {
    id: 'projeto-casa-moderna-ead-360-v2',
    title: 'Crie imersão em ambiente em 360º',
    author: 'Prof. Eduardo Natário',
    institution: 'Faculdade de Arquitetura & Design Instrucional',
    description: 'Ambiente imersivo 360° para estudo de conceitos bioclimáticos, iluminação natural, circulação integrada e conforto espacial em habitações contemporâneas.',
    initialSceneId: 'sala-estar',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scenes: [
      {
        id: 'sala-estar',
        name: 'Sala de Estar Integrada',
        description: 'Área social ampla com grandes panos de vidro voltados para a insolação matinal e integração direta ao paisagismo.',
        imageUrl: livingPano,
        initialPitch: 0,
        initialYaw: 0,
        initialHfov: 100,
        hotspots: [
          {
            id: 'hs-sala-info-1',
            type: 'info',
            pitch: 5,
            yaw: -40,
            title: 'Arquitetura Bioclimática e Painéis de Vidro',
            description: 'Os grandes caixilhos do chão ao teto foram posicionados no eixo Norte-Nordeste. Isso permite ventilação cruzada contínua, reduzindo em até 40% a necessidade de climatização artificial e aproveitando a sombra natural das árvores do jardim.',
            category: 'Sustentabilidade',
            iconName: 'lightbulb',
            imageUrl: bioclimaticImg,
          },
          {
            id: 'hs-sala-info-2',
            type: 'info',
            pitch: 28,
            yaw: 15,
            title: 'Forro de Madeira Ripada e Conforto Acústico',
            description: 'O revestimento em ripas lineares de madeira possui espaçamento milimétrico calculado para difusão sonora e absorção de reverberações, garantindo uma inteligibilidade impecável para aulas e encontros de convivência.',
            category: 'Acústica & Materiais',
            iconName: 'book',
            imageUrl: acousticsImg,
          },
          {
            id: 'hs-sala-nav-cozinha',
            type: 'scene',
            pitch: -4,
            yaw: 58,
            title: 'Ir para a Cozinha Gourmet ➔',
            targetSceneId: 'cozinha-gourmet',
            targetPitch: -2,
            targetYaw: 0,
          },
          {
            id: 'hs-sala-nav-quarto',
            type: 'scene',
            pitch: -2,
            yaw: -108,
            title: 'Acessar Quarto Principal ➔',
            targetSceneId: 'quarto-suite',
            targetPitch: 0,
            targetYaw: 10,
          },
        ],
      },
      {
        id: 'cozinha-gourmet',
        name: 'Cozinha Gourmet Integrada',
        description: 'Espaço funcional centrado na ilha de preparo em mármore calacatta com bancada cascata e armários em nogueira.',
        imageUrl: kitchenPano,
        initialPitch: -2,
        initialYaw: 0,
        initialHfov: 100,
        hotspots: [
          {
            id: 'hs-coz-info-1',
            type: 'info',
            pitch: -15,
            yaw: 0,
            title: 'Ilha em Mármore Calacatta e Ergonomia',
            description: 'A disposição da pia, refrigerador e cooktop de indução segue a métrica de circulação sem interrupções. A distância entre os vértices mantém-se entre 1,20m e 2,10m, reduzindo a fadiga do usuário e promovendo segurança operacional.',
            category: 'Ergonomia',
            iconName: 'info',
            imageUrl: materialsImg,
          },
          {
            id: 'hs-coz-info-2',
            type: 'info',
            pitch: 16,
            yaw: -35,
            title: 'Marcenaria em Nogueira e Eletros Embutidos',
            description: 'Armários altos verticais com puxadores ocultos e torre quente integrada otimizam o armazenamento sem interferir no campo visual da integração com o living.',
            category: 'Design de Interiores',
            iconName: 'lightbulb',
            imageUrl: lightingImg,
          },
          {
            id: 'hs-coz-nav-sala',
            type: 'scene',
            pitch: -5,
            yaw: -95,
            title: 'Retornar para a Sala de Estar ➔',
            targetSceneId: 'sala-estar',
            targetPitch: 0,
            targetYaw: 0,
          },
          {
            id: 'hs-coz-nav-quarto',
            type: 'scene',
            pitch: -3,
            yaw: 88,
            title: 'Acessar Quarto Principal ➔',
            targetSceneId: 'quarto-suite',
            targetPitch: 0,
            targetYaw: 10,
          },
        ],
      },
      {
        id: 'quarto-suite',
        name: 'Quarto Principal Suíte',
        description: 'Ambiente intimista planejado para desaceleração, com cabeceira estofada contínua, iluminação indireta e closet em vidro.',
        imageUrl: bedroomPano,
        initialPitch: 0,
        initialYaw: 10,
        initialHfov: 100,
        hotspots: [
          {
            id: 'hs-quarto-info-1',
            type: 'info',
            pitch: 18,
            yaw: 0,
            title: 'Design para o Ritmo Circadiano',
            description: 'A iluminação artificial do quarto utiliza dimerização e espectro de luz quente (2700K) que induz a produção natural de melatonina no período noturno, prevenindo a fadiga visual e distúrbios de sono.',
            category: 'Neuroarquitetura',
            iconName: 'eye',
            imageUrl: lightingImg,
          },
          {
            id: 'hs-quarto-info-2',
            type: 'info',
            pitch: -2,
            yaw: 65,
            title: 'Armários com Vidro Reflecta Bronze',
            description: 'O closet integrado conta com painéis envidraçados translúcidos que multiplicam a luz natural de dia e transformam o espaço em uma vitrine acolhedora à noite com fitas de LED internas.',
            category: 'Design de Interiores',
            iconName: 'book',
            imageUrl: materialsImg,
          },
          {
            id: 'hs-quarto-nav-banheiro',
            type: 'scene',
            pitch: -4,
            yaw: 90,
            title: 'Entrar no Banheiro SPA ➔',
            targetSceneId: 'banheiro-spa',
            targetPitch: 0,
            targetYaw: 0,
          },
          {
            id: 'hs-quarto-nav-sala',
            type: 'scene',
            pitch: -5,
            yaw: -130,
            title: 'Voltar para a Sala de Estar ➔',
            targetSceneId: 'sala-estar',
            targetPitch: 0,
            targetYaw: 0,
          },
        ],
      },
      {
        id: 'banheiro-spa',
        name: 'Banheiro de Design / SPA',
        description: 'Refúgio de bem-estar com banheira de imersão freestanding, bancada em mármore nero marquina e espelhos orgânicos.',
        imageUrl: bathroomPano,
        initialPitch: 0,
        initialYaw: 0,
        initialHfov: 100,
        hotspots: [
          {
            id: 'hs-banh-info-1',
            type: 'info',
            pitch: -18,
            yaw: -50,
            title: 'Banheira Freestanding em Rocha Vulcânica',
            description: 'Produzida a partir de rocha calcária vulcânica misturada a resinas de alto desempenho, a peça preserva a temperatura da água por até 3 vezes mais tempo que acrílicos convencionais, dispensando reaquecimento.',
            category: 'Materiais & Sustentabilidade',
            iconName: 'info',
            imageUrl: spaImg,
          },
          {
            id: 'hs-banh-info-2',
            type: 'info',
            pitch: 10,
            yaw: 0,
            title: 'Espelhos Orgânicos com Iluminação LED Indireta',
            description: 'A iluminação retroiluminada elimina sombras duras no rosto durante a higiene pessoal e cria uma atmosfera relaxante que valoriza os veios do mármore escuro.',
            category: 'Luminotécnica',
            iconName: 'lightbulb',
            imageUrl: spaImg,
          },
          {
            id: 'hs-banh-nav-quarto',
            type: 'scene',
            pitch: -4,
            yaw: 140,
            title: 'Retornar ao Quarto Principal ➔',
            targetSceneId: 'quarto-suite',
            targetPitch: 0,
            targetYaw: 10,
          },
        ],
      },
    ],
  };
}
