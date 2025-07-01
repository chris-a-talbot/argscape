import React from 'react';
import BaseLessonComponent, { LessonConfig } from './BaseLessonComponent';
import { IntroPageContent, ResourcesPageContent, InteractiveElement, MultiColumnLayout } from './LessonPageHelpers';
import { LearningObjective, KeyTerm, ContentBox, VisualElement } from './LessonSlide';
import {
  InteractiveDNAPreview,
  InteractiveDNAStructure,
  VirtualOrganismLab,
  MutationVisualization,
  NucleotideDiversityCalculator,
  InteractiveSelfCheck,
  AlleleFrequencyCalculator,
  SiteFrequencySpectrum,
  PolymorphismExplorer
} from './Lesson1_1_Components';

// Quiz Questions
const QUIZ_QUESTIONS = [
  {
    question: "The lesson explained that DNA's structure enables accurate replication. Which specific feature allows each strand to serve as a template for creating its complement?",
    options: [
      "The phosphodiester bonds create strong structural support",
      "The antiparallel orientation prevents errors during copying",
      "The complementary base pairing rules (A-T, G-C) ensure accurate matching",
      "The double helix protects the bases from environmental damage"
    ],
    correctAnswer: "The complementary base pairing rules (A-T, G-C) ensure accurate matching",
    explanation: "The complementary base pairing rules create a stable double helix structure and ensure that each strand can serve as an accurate template for DNA replication."
  },
  {
    question: "In the virtual organism lab, you saw how different alleles produce different phenotypes. If a population has alleles R, r, and r' at a flower color gene, how many distinct genotypes are possible?",
    options: [
      "3 (one for each allele)",
      "6 (RR, Rr, Rr', rr, rr', r'r')",
      "9 (3 alleles × 3 alleles)",
      "It depends on which alleles are dominant"
    ],
    correctAnswer: "6 (RR, Rr, Rr', rr, rr', r'r')",
    explanation: "With 3 alleles at a diploid locus, we get n(n+1)/2 = 3(4)/2 = 6 possible genotypes: 3 homozygotes and 3 heterozygotes."
  },
  {
    question: "The lesson showed that genetic variation comes from multiple sources. Why are neutral mutations especially useful for studying population history and relationships?",
    options: [
      "They are the most common type of mutation in natural populations",
      "They accumulate steadily over time since natural selection doesn't eliminate them",
      "They are easier to detect using modern sequencing technologies",
      "They always result in visible changes that can be easily studied"
    ],
    correctAnswer: "They accumulate steadily over time since natural selection doesn't eliminate them",
    explanation: "Neutral mutations are not subject to natural selection, so they accumulate at a roughly constant rate, making them ideal molecular clocks for studying evolutionary history."
  },
  {
    question: "You used the nucleotide diversity calculator to compare different datasets. What would a very low π value (like 0.001) most likely indicate about a population's recent history?",
    options: [
      "The population has been rapidly expanding in size",
      "The population has experienced high levels of gene flow",
      "The population likely went through a bottleneck or founder event",
      "The population has been under strong diversifying selection"
    ],
    correctAnswer: "The population likely went through a bottleneck or founder event",
    explanation: "Low nucleotide diversity typically indicates a recent reduction in effective population size, which reduces genetic variation through genetic drift."
  }
];

// Lesson Configuration
const lessonConfig: LessonConfig = {
  id: 'lesson-1-1',
  moduleId: 'module-1',
  title: 'DNA, Genes, and Variation',
  estimatedTimeMinutes: 25,
  passingScore: 75,
  nextLessonId: 'lesson-1-2',
  quizQuestions: QUIZ_QUESTIONS,
  pages: [
    // Intro Page
    {
      type: 'intro',
      title: 'DNA, Genes, and Variation',
      subtitle: 'Foundations for Population Genetics',
      content: (
        <IntroPageContent
          title="DNA, Genes, and Variation"
          subtitle="Foundations for Population Genetics"
          description="Welcome to the foundation of population genetics! In this lesson, we'll explore the molecular basis of heredity and variation that makes evolutionary studies possible. Understanding DNA structure, genes, alleles, and genetic variation is essential for grasping how populations evolve over time. These concepts form the building blocks for more advanced topics like coalescent theory and phylogenetic analysis."
          objectives={[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              ),
              text: 'Analyze DNA\'s double helix structure and its role in hereditable information storage'
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              text: 'Distinguish between genes and alleles and understand their relationship to phenotype'
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9z" />
                </svg>
              ),
              text: 'Identify sources of genetic variation and calculate nucleotide diversity measures'
            }
          ]}
          estimatedTime={25}
          previewElement={<InteractiveDNAPreview />}
          studyTip="Use the scratch pad (bottom right) to take notes as you progress through the lesson. Your notes will be saved automatically!"
        />
      )
    },

    // Content Page 1: DNA Structure and Function
    {
      type: 'content',
      title: 'DNA Structure and Function',
      subtitle: 'The Molecular Foundation of Heredity',
      content: (
        <>
          <ContentBox>
            <p>DNA (Deoxyribonucleic Acid) is the universal molecule of heredity, storing genetic information in all living organisms. Understanding its structure is crucial for grasping how genetic information is maintained, replicated, and passed between generations.</p>
          </ContentBox>

          <VisualElement caption="Interactive DNA Structure - Click on different components to explore">
            <InteractiveDNAStructure />
          </VisualElement>

          <MultiColumnLayout columns={2}>
            <ContentBox title="Historical Context">
              <div className="space-y-3 text-sm">
                <div className="bg-sp-pale-green/10 p-3 rounded-lg border-l-4 border-sp-pale-green">
                  <p className="font-semibold text-sp-pale-green">1953: Watson & Crick</p>
                  <p className="text-sp-white/80">Proposed the double helix model using X-ray crystallography data from Rosalind Franklin.</p>
                </div>
                <div className="bg-sp-pale-green/10 p-3 rounded-lg border-l-4 border-sp-pale-green">
                  <p className="font-semibold text-sp-pale-green">Key Insight</p>
                  <p className="text-sp-white/80">The complementary base pairing (A-T, G-C) explains both structure stability and replication mechanism.</p>
                </div>
              </div>
            </ContentBox>

            <ContentBox title="DNA's Role in Heredity">
              <ul className="space-y-2 text-sm text-sp-white/80">
                <li>• <strong>Information Storage:</strong> Genetic instructions encoded in base sequences</li>
                <li>• <strong>Faithful Replication:</strong> Template-based copying ensures accuracy</li>
                <li>• <strong>Stable Inheritance:</strong> Chemical bonds maintain information across generations</li>
                <li>• <strong>Evolutionary Record:</strong> Mutations create variation for natural selection</li>
              </ul>
            </ContentBox>
          </MultiColumnLayout>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="DNA">
              Deoxyribonucleic acid - the molecule that carries genetic instructions in living organisms.
            </KeyTerm>
            <KeyTerm term="Nucleotide">
              Building block of DNA consisting of a phosphate group, deoxyribose sugar, and nitrogenous base.
            </KeyTerm>
            <KeyTerm term="Base Pair">
              Complementary nucleotides held together by hydrogen bonds (A-T or G-C).
            </KeyTerm>
            <KeyTerm term="Double Helix">
              The twisted ladder structure of DNA with two antiparallel strands.
            </KeyTerm>
          </MultiColumnLayout>

          <ContentBox title="The Chemistry of Information">
            <p>The sequence of nucleotides along DNA strands encodes genetic information. The strict base-pairing rules (purines A,G pair with pyrimidines T,C respectively) create a redundant system where each strand serves as a template for its complement - the foundation of DNA replication and repair.</p>
          </ContentBox>
        </>
      )
    },

    // Content Page 2: Genes and Alleles
    {
      type: 'content',
      title: 'Genes and Alleles',
      subtitle: 'From Genetic Code to Observable Traits',
      content: (
        <>
          <ContentBox>
            <p>Genes and alleles are fundamental concepts that bridge the gap between DNA sequences and the traits we observe in organisms. Understanding their relationship is essential for population genetics.</p>
          </ContentBox>

          <ContentBox title="Key Definitions">
            <MultiColumnLayout columns={2}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Gene</h4>
                  <p className="text-sm text-sp-white/80">A specific DNA sequence at a particular location (locus) that can be inherited and typically codes for a functional product.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Allele</h4>
                  <p className="text-sm text-sp-white/80">Alternative versions of the same gene that arise through mutation and provide variation in populations.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Genotype</h4>
                  <p className="text-sm text-sp-white/80">The specific combination of alleles an individual carries for a particular gene or set of genes.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Phenotype</h4>
                  <p className="text-sm text-sp-white/80">The observable characteristics resulting from the interaction of genotype with the environment.</p>
                </div>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <VisualElement caption="Virtual Organism Lab - Select different allele combinations to see phenotype changes">
            <VirtualOrganismLab />
          </VisualElement>

          <ContentBox title="The Importance of Allelic Diversity">
            <p>Genetic diversity within populations provides the raw material for evolution. Different alleles may:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Confer different fitness advantages</strong> under varying environmental conditions</li>
              <li><strong>Provide population resilience</strong> against diseases or environmental changes</li>
              <li><strong>Enable adaptation</strong> to new ecological niches over time</li>
              <li><strong>Maintain genetic health</strong> by preventing inbreeding depression</li>
            </ul>
            <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20 mt-4">
              <p className="text-sm text-sp-white/80"><strong>Population Genetics Perspective:</strong> We track allele frequencies over time to understand evolutionary processes like selection, drift, and gene flow.</p>
            </div>
          </ContentBox>

          <MultiColumnLayout columns={3}>
            <KeyTerm term="Gene">
              A hereditable unit of DNA that occupies a specific location on a chromosome.
            </KeyTerm>
            <KeyTerm term="Allele">
              One of two or more alternative forms of a gene that can occupy the same locus.
            </KeyTerm>
            <KeyTerm term="Genotype">
              The genetic constitution of an individual organism.
            </KeyTerm>
          </MultiColumnLayout>

          <MultiColumnLayout columns={2}>
            <KeyTerm term="Phenotype">
              The set of observable characteristics of an individual.
            </KeyTerm>
            <KeyTerm term="Locus">
              The specific physical location of a gene or DNA sequence on a chromosome.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 3: Genetic Variation
    {
      type: 'content',
      title: 'Genetic Variation',
      subtitle: 'Sources and Significance',
      content: (
        <>
          <ContentBox>
            <p><strong>Genetic variation</strong> describes the differences in DNA sequences among individuals in a population. This variation is the raw material for evolution and provides the foundation for understanding population history and dynamics.</p>
            <p>Without genetic variation, populations would lack the flexibility to adapt to changing environments, and we would have no way to reconstruct evolutionary relationships. Understanding how variation arises and changes over time is crucial for population genetics.</p>
          </ContentBox>

          <VisualElement caption="Interactive mutation simulation and genetic diversity tracking across generations">
            <MutationVisualization />
          </VisualElement>

          <ContentBox title="How Genetic Variation Shapes Populations">
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Sources of New Variation</h4>
                <ul className="space-y-2 text-sm text-sp-white/80">
                  <li>• <strong>Mutation:</strong> Creates entirely new alleles through DNA replication errors</li>
                  <li>• <strong>Recombination:</strong> Shuffles existing alleles into novel combinations during reproduction</li>
                  <li>• <strong>Gene Flow:</strong> Introduces alleles from other populations through migration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Factors Affecting Diversity</h4>
                <ul className="space-y-2 text-sm text-sp-white/80">
                  <li>• <strong>Population Size:</strong> Smaller populations lose diversity through genetic drift</li>
                  <li>• <strong>Selection:</strong> Can increase or decrease variation depending on type</li>
                  <li>• <strong>Bottlenecks:</strong> Dramatic reductions in population size reduce diversity</li>
                </ul>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="Mutation">
              Random changes in DNA sequence that create new alleles and provide the ultimate source of all genetic variation.
            </KeyTerm>
            <KeyTerm term="Recombination">
              The process during sexual reproduction that creates new combinations of existing alleles.
            </KeyTerm>
            <KeyTerm term="Gene Flow">
              The transfer of alleles between populations through migration and interbreeding.
            </KeyTerm>
            <KeyTerm term="Genetic Drift">
              Random changes in allele frequencies due to sampling effects, especially strong in small populations.
            </KeyTerm>
          </MultiColumnLayout>

          <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.998-2.386l-.548-.547z" />
              </svg>
              <span className="font-semibold text-sp-pale-green">Key Insight</span>
            </div>
            <p className="text-sp-white/80">The balance between processes that create variation (mutation, recombination, gene flow) and those that reduce it (drift, selection) determines the genetic diversity we observe in natural populations.</p>
          </div>
        </>
      )
    },

    // Content Page 4: Measuring Genetic Variation
    {
      type: 'content',
      title: 'Measuring Genetic Variation',
      subtitle: 'Nucleotide Diversity and Its Applications',
      content: (
        <>
          <ContentBox>
            <p>To quantify genetic variation, population geneticists use several measures. The most fundamental is <strong>nucleotide diversity (π)</strong>, which measures the average number of nucleotide differences per site between randomly chosen DNA sequences from a population.</p>
            <p>This simple measure provides powerful insights into population history, demographic events, and evolutionary processes. It serves as a cornerstone for many analyses in evolutionary biology and conservation genetics.</p>
          </ContentBox>

          <VisualElement caption="Interactive nucleotide diversity calculator with real-world datasets">
            <NucleotideDiversityCalculator />
          </VisualElement>

          <ContentBox title="Understanding Nucleotide Diversity">
            <MultiColumnLayout columns={2}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">The Formula</h4>
                  <div className="bg-gray-800 rounded p-3 font-mono text-center text-sp-white">
                    π = Σ(pairwise differences) / (total comparisons × sequence length)
                  </div>
                  <p className="text-sm text-sp-white/80 mt-2">This gives us the probability that two randomly chosen nucleotides at the same position differ between sequences.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Interpreting Values</h4>
                  <ul className="space-y-1 text-sm text-sp-white/80">
                    <li>• <span className="text-red-400">π &lt; 0.001:</span> Low diversity (humans, bottlenecked populations)</li>
                    <li>• <span className="text-yellow-400">π ≈ 0.01:</span> Moderate diversity (many plant/animal species)</li>
                    <li>• <span className="text-green-400">π &gt; 0.02:</span> High diversity (some insects, outcrossing plants)</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">What Affects π?</h4>
                  <ul className="space-y-2 text-sm text-sp-white/80">
                    <li>• <strong>Effective population size:</strong> Larger populations maintain more diversity</li>
                    <li>• <strong>Mutation rate:</strong> Higher rates create more variation</li>
                    <li>• <strong>Selection:</strong> Can increase or decrease diversity</li>
                    <li>• <strong>Population history:</strong> Bottlenecks reduce diversity</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sp-pale-green mb-2">Applications</h4>
                  <ul className="space-y-1 text-sm text-sp-white/80">
                    <li>• Conservation: Assessing population health</li>
                    <li>• Medicine: Understanding disease susceptibility</li>
                    <li>• Agriculture: Evaluating crop genetic resources</li>
                    <li>• Evolution: Detecting selection and demographic changes</li>
                  </ul>
                </div>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={2}>
            <KeyTerm term="Nucleotide Diversity (π)">
              A measure of genetic diversity that quantifies the average number of nucleotide differences per site between sequences.
            </KeyTerm>
            <KeyTerm term="Heterozygosity">
              The proportion of individuals in a population that are heterozygous (carrying different alleles) at a given locus.
            </KeyTerm>
          </MultiColumnLayout>

          <div className="bg-yellow-100/10 rounded-lg p-4 border border-yellow-300/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-yellow-400">Simplified Formula</span>
            </div>
            <p className="text-sp-white/80 text-sm">Think of π as: "If I pick two random DNA sequences from my population and compare them base by base, what's the chance that any given position will be different?" This intuitive interpretation helps connect the math to biological meaning.</p>
          </div>
        </>
      )
    },

         // Content Page 5: Allele Frequencies and Population Variation
     {
       type: 'content',
       title: 'Allele Frequencies and Population Variation',
       subtitle: 'Quantifying Genetic Diversity in Populations',
       content: (
         <>
           <ContentBox>
             <p>Population genetics begins with quantifying genetic variation within populations. Understanding how to measure and interpret allele frequencies is fundamental to studying evolution, population structure, and the forces that shape genetic diversity over time.</p>
           </ContentBox>

           <ContentBox title="Enhanced Locus and Allele Definitions">
             <MultiColumnLayout columns={2}>
               <div>
                 <h4 className="font-semibold text-sp-pale-green mb-2">Precise Terminology</h4>
                 <ul className="space-y-2 text-sm text-sp-white/80">
                   <li>• <strong>Locus:</strong> A specific, fixed position on a chromosome</li>
                   <li>• <strong>Allele:</strong> Alternative forms of DNA sequence at a particular locus</li>
                   <li>• <strong>Monomorphic:</strong> Only one allele exists in the population</li>
                   <li>• <strong>Polymorphic:</strong> Multiple alleles exist in the population</li>
                 </ul>
               </div>
               <div>
                 <h4 className="font-semibold text-sp-pale-green mb-2">Allele Classification</h4>
                 <ul className="space-y-2 text-sm text-sp-white/80">
                   <li>• <strong>Major Allele:</strong> Most common allele (&gt;50%)</li>
                   <li>• <strong>Minor Allele:</strong> Less common alleles (5-50%)</li>
                   <li>• <strong>Ancestral Allele:</strong> Older form (compared to outgroup)</li>
                   <li>• <strong>Derived Allele:</strong> Newer form arising from mutation</li>
                 </ul>
               </div>
             </MultiColumnLayout>
           </ContentBox>

           <VisualElement caption="Explore polymorphic vs monomorphic loci and allele classification">
             <PolymorphismExplorer />
           </VisualElement>

           <ContentBox title="Mathematical Foundation of Allele Frequencies">
             <p>For a diploid autosomal locus with alleles A₁ and A₂, we calculate allele frequencies from genotype counts:</p>
             <div className="bg-gray-800 rounded-lg p-4 my-4">
               <div className="font-mono text-center space-y-2">
                 <div className="text-sp-pale-green text-lg">p = (2N₁₁ + N₁₂) / 2N</div>
                 <div className="text-sp-white text-sm">where N₁₁, N₁₂, N₂₂ are genotype counts</div>
                 <div className="text-sp-white text-sm">and N is total individuals</div>
               </div>
             </div>
             <p>This formula counts each allele once per chromosome, giving us the true population allele frequency.</p>
           </ContentBox>

           <VisualElement caption="Interactive allele frequency calculator with mathematical formulas">
             <AlleleFrequencyCalculator />
           </VisualElement>

           <ContentBox title="Site Frequency Spectrum: Advanced Diversity Measure">
             <p>The <strong>Site Frequency Spectrum (SFS)</strong> is a powerful tool that describes the distribution of derived allele frequencies across polymorphic sites. It's highly sensitive to demographic history and natural selection, making it invaluable for evolutionary inference.</p>
             <MultiColumnLayout columns={2}>
               <div>
                 <h4 className="font-semibold text-sp-pale-green mb-2">What the SFS Shows</h4>
                 <ul className="space-y-1 text-sm text-sp-white/80">
                   <li>• Count of sites where derived allele appears in k out of n chromosomes</li>
                   <li>• Histogram bins represent different frequency classes</li>
                   <li>• Shape reveals population history and selection</li>
                 </ul>
               </div>
               <div>
                 <h4 className="font-semibold text-sp-pale-green mb-2">Evolutionary Signatures</h4>
                 <ul className="space-y-1 text-sm text-sp-white/80">
                   <li>• <strong>Neutral:</strong> Declining pattern (1/f slope)</li>
                   <li>• <strong>Expansion:</strong> Excess rare variants</li>
                   <li>• <strong>Bottleneck:</strong> Flattened spectrum</li>
                   <li>• <strong>Selection:</strong> Distorted frequency classes</li>
                 </ul>
               </div>
             </MultiColumnLayout>
           </ContentBox>

           <VisualElement caption="Interactive site frequency spectrum showing demographic and selection signatures">
             <SiteFrequencySpectrum />
           </VisualElement>

           <MultiColumnLayout columns={4}>
             <KeyTerm term="Monomorphic Locus">
               A locus where only one allele exists in the population - no genetic variation present.
             </KeyTerm>
             <KeyTerm term="Polymorphic Locus">
               A locus where multiple alleles exist in the population - genetic variation is present.
             </KeyTerm>
             <KeyTerm term="Major Allele">
               The most common allele at a locus, typically with frequency greater than 50%.
             </KeyTerm>
             <KeyTerm term="Minor Allele">
               All alleles except the most common one; usually refers to alleles with frequency 5-50%.
             </KeyTerm>
           </MultiColumnLayout>

           <MultiColumnLayout columns={3}>
             <KeyTerm term="Ancestral Allele">
               The older form of an allele, inferred by comparison to outgroup species.
             </KeyTerm>
             <KeyTerm term="Derived Allele">
               The newer form of an allele that arose more recently through mutation.
             </KeyTerm>
             <KeyTerm term="Site Frequency Spectrum">
               Distribution describing frequencies of derived alleles at polymorphic sites in a sample.
             </KeyTerm>
           </MultiColumnLayout>

           <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
             <div className="flex items-center gap-2 mb-2">
               <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.998-2.386l-.548-.547z" />
               </svg>
               <span className="font-semibold text-sp-pale-green">Population Genetics Foundation</span>
             </div>
             <p className="text-sp-white/80">These quantitative measures of genetic variation form the mathematical foundation for understanding how populations evolve. Allele frequencies are the basic currency of population genetics, while the SFS provides detailed signatures of evolutionary history.</p>
           </div>
         </>
       )
     },

    // Content Page 6: Summary and Connections
    {
      type: 'content',
      title: 'Summary and Connections',
      subtitle: 'Linking Foundations to Population Genetics',
      content: (
        <>
          <ContentBox>
            <p>Let's consolidate the key concepts and understand how they connect to broader population genetics topics:</p>
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-3">Essential Ideas</h4>
                <ul className="space-y-2 text-sm text-sp-white/80">
                  <li>• <strong>DNA's Structure:</strong> Ensures high-fidelity inheritance, making it possible to trace genealogical history through its sequence.</li>
                  <li>• <strong>Genes as Loci:</strong> Represent heritable units whose different states (alleles) can be tracked through a population.</li>
                  <li>• <strong>Alleles as States:</strong> Arise from mutation and provide the variation that population genetic models analyze.</li>
                  <li>• <strong>Genetic Variation as Data:</strong> The pattern of allelic differences among individuals is the raw data for inferring the historical processes of evolution.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-3">Connections to Population Genetics</h4>
                <div className="space-y-3">
                  <div className="bg-sp-very-dark-blue/50 rounded p-3">
                    <div className="font-medium text-sp-pale-green">Coalescent Theory</div>
                    <div className="text-xs text-sp-white/70">Uses genetic variation to infer common ancestors</div>
                  </div>
                  <div className="bg-sp-very-dark-blue/50 rounded p-3">
                    <div className="font-medium text-sp-pale-green">Phylogenetics</div>
                    <div className="text-xs text-sp-white/70">Reconstructs evolutionary relationships from DNA sequences</div>
                  </div>
                  <div className="bg-sp-very-dark-blue/50 rounded p-3">
                    <div className="font-medium text-sp-pale-green">Natural Selection</div>
                    <div className="text-xs text-sp-white/70">Acts on phenotypic differences arising from genetic variation</div>
                  </div>
                </div>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <VisualElement caption="Test your understanding with immediate feedback">
            <InteractiveSelfCheck />
          </VisualElement>

          <ContentBox>
            <p>With this foundation, we can now begin to think about how to model the history of genetic variation in populations. The next lessons will explore how these molecular building blocks give rise to the patterns we observe in evolutionary data.</p>
          </ContentBox>

          <div className="bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-sp-pale-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold text-sp-pale-green">Next Steps</span>
            </div>
            <p className="text-sp-white/80">Ready for the quiz? You'll need 75% or higher to complete this lesson and unlock the next module on population genetics principles.</p>
          </div>
        </>
      )
    },

    // Quiz Page (handled automatically by BaseLessonComponent)
    {
      type: 'quiz',
      title: 'Interactive Quiz',
      subtitle: 'Test Your Understanding',
      content: null // This will be handled by the QuizPage component in BaseLessonComponent
    },

    // Resources Page
    {
      type: 'resources',
      title: 'Additional Resources',
      subtitle: 'Continue Your Learning Journey',
      content: (
        <ResourcesPageContent
          congratsMessage="Congratulations on completing the fundamentals! Here are curated resources to deepen your understanding and prepare for advanced topics in population genetics."
          nextLessonDescription="You've mastered the molecular foundations! The next lesson will introduce population genetics principles, including Hardy-Weinberg equilibrium and factors that cause evolutionary change. Up Next: Population Genetics Fundamentals - How allele frequencies change over time and what shapes genetic diversity in real populations."
          resources={{
            textbooks: [
              { title: 'Introduction to Population Genetics', author: 'Halliburton', description: 'Comprehensive introduction to population genetic theory' },
              { title: 'Molecular Evolution', author: 'Li & Graur', description: 'Advanced treatment of molecular evolutionary processes' },
              { title: 'Coalescent Theory', author: 'Wakeley', description: 'In-depth coverage of coalescent methods' }
            ],
            articles: [
              { title: 'The neutral theory of molecular evolution - Kimura (1968)', description: 'Foundational paper on neutral evolution' },
              { title: 'Nucleotide diversity in humans - Li & Sadler (1991)', description: 'Classic study of human genetic variation' },
              { title: 'Patterns of DNA sequence variation - Kreitman (2000)', description: 'Review of sequence variation patterns' }
            ],
            databases: [
              { name: '1000 Genomes Project', description: 'Human genetic variation data' },
              { name: 'NCBI dbSNP', description: 'Single nucleotide polymorphism database' },
              { name: 'Ensembl', description: 'Genome browser with variation data' }
            ],
            software: [
              { name: 'DnaSP', description: 'DNA sequence polymorphism analysis' },
              { name: 'Arlequin', description: 'Population genetics software' },
              { name: 'MEGA', description: 'Molecular evolutionary genetics analysis' }
            ]
          }}
          practiceExercises={[
            {
              icon: '🧬',
              title: 'DNA Analysis',
              description: 'Practice calculating nucleotide diversity using real sequence data from public databases'
            },
            {
              icon: '📊',
              title: 'Data Visualization',
              description: 'Create plots showing genetic diversity patterns across different populations'
            },
            {
              icon: '🔬',
              title: 'Case Studies',
              description: 'Analyze real-world examples of genetic variation in conservation and medicine'
            }
          ]}
        />
      )
    }
  ]
};

// Main Component
export default function Lesson1_1() {
  return <BaseLessonComponent config={lessonConfig} />;
} 