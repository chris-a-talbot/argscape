import BaseLessonComponent, { LessonConfig } from './BaseLessonComponent';
import { IntroPageContent, ResourcesPageContent, MultiColumnLayout } from './LessonPageHelpers';
import { KeyTerm, ContentBox, VisualElement } from './LessonSlide';
import {
  InteractivePedigreePreview,
  MendelianInheritanceSimulator,
  MeiosisSimulation,
  PedigreeBuilder,
  GenomeWideGenealogy,
  RelatednessCalculator,
  InteractiveSelfCheck,
  IdentityByDescentExplorer
} from './Lesson1_2_Components';

// Quiz Questions
const QUIZ_QUESTIONS = [
  {
    question: "If two heterozygous parents (Aa) have four children, what is the most likely outcome according to Mendel's Law of Segregation?",
    options: [
      "All four children will have the dominant phenotype",
      "Exactly three children will have the dominant phenotype and one will have the recessive phenotype",
      "Two children will have the dominant phenotype and two will have the recessive phenotype",
      "The phenotypic ratio will approximate 3:1 dominant to recessive, but exact numbers may vary due to chance"
    ],
    correctAnswer: "The phenotypic ratio will approximate 3:1 dominant to recessive, but exact numbers may vary due to chance",
    explanation: "Mendel's Law of Segregation predicts a 3:1 ratio in the long run, but with only four offspring, random chance means the actual outcome may deviate from this expected ratio. Each child has a 3/4 chance of showing the dominant phenotype."
  },
  {
    question: "During meiosis, crossing over between homologous chromosomes is most significant because it:",
    options: [
      "Ensures proper chromosome alignment during metaphase",
      "Reduces chromosome number from diploid to haploid",
      "Breaks linkage between genes and increases genetic diversity",
      "Prevents mutations from occurring during DNA replication"
    ],
    correctAnswer: "Breaks linkage between genes and increases genetic diversity",
    explanation: "Crossing over creates new combinations of alleles that were originally on the same chromosome, breaking genetic linkage and generating novel genetic combinations that increase diversity in offspring."
  },
  {
    question: "Two siblings have a coefficient of relatedness (r) of 0.5. This means that:",
    options: [
      "They share exactly 50% of the same DNA sequences",
      "They inherited identical copies of 50% of their genes from their parents",
      "On average, they share 50% of their alleles that are identical by descent",
      "They have identical genotypes at 50% of all genetic loci"
    ],
    correctAnswer: "On average, they share 50% of their alleles that are identical by descent",
    explanation: "The coefficient of relatedness measures the probability that two individuals share alleles that are identical by descent (inherited from a common ancestor). Siblings share 50% IBD on average, but this doesn't mean they're identical at 50% of loci or share 50% of all DNA sequences."
  },
  {
    question: "When analyzing a pedigree showing an autosomal recessive trait, you observe that two unaffected parents have an affected child. What can you conclude about Mendel's Law of Independent Assortment in this family?",
    options: [
      "The law is violated because the parents don't show the trait",
      "The law cannot be assessed from this single trait inheritance pattern",
      "The law is confirmed because the trait skipped a generation",
      "The law is violated because the affected child received alleles from both parents"
    ],
    correctAnswer: "The law cannot be assessed from this single trait inheritance pattern",
    explanation: "Mendel's Law of Independent Assortment describes how different genes assort independently during meiosis. To test this law, you need to track the inheritance of at least two different traits simultaneously. A single trait inheritance pattern only demonstrates the Law of Segregation."
  }
];

// Lesson Configuration
const lessonConfig: LessonConfig = {
  id: 'lesson-1-2',
  moduleId: 'module-1',
  title: 'Inheritance, Meiosis, and Generations',
  estimatedTimeMinutes: 30,
  passingScore: 75,
  nextLessonId: 'lesson-1-3',
  quizQuestions: QUIZ_QUESTIONS,
  pages: [
    // Intro Page
    {
      type: 'intro',
      title: 'Inheritance and Genealogies',
      subtitle: 'Foundations for Understanding Population Genetics',
      content: (
        <IntroPageContent
          title="Inheritance and Genealogies"
          subtitle="Foundations for Understanding Population Genetics"
          description="Welcome to the second lesson in population genetics! Here we'll explore how genetic information is passed between generations through inheritance and meiosis, and how we can track these patterns using pedigrees and genealogies. Understanding these mechanisms is crucial for grasping how genetic variation moves through populations over time and forms the foundation for coalescent theory and phylogenetic analysis."
          objectives={[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              text: 'Master Mendelian inheritance patterns and predict genetic outcomes using Punnett squares'
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ),
              text: 'Explore how meiosis creates genetic diversity through chromosome segregation'
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              text: 'Learn to analyze pedigrees and understand genetic relatedness measures'
            }
          ]}
          estimatedTime={30}
          previewElement={<InteractivePedigreePreview />}
          studyTip="Pay special attention to how inheritance patterns at the cellular level (meiosis) connect to patterns we observe in families and populations! Use the scratch pad (bottom right) to track inheritance patterns as you work through the pedigrees."
        />
      )
    },

    // Content Page 1: Basics of Genetic Inheritance
    {
      type: 'content',
      title: 'Basics of Genetic Inheritance',
      subtitle: 'Understanding Mendelian Patterns',
      content: (
        <>
          <ContentBox>
            <p>Mendelian genetics forms the foundation for understanding how traits are passed from generation to generation. These principles, discovered through Gregor Mendel's careful experiments with pea plants (1856-1863), help us understand both simple and complex inheritance patterns in populations and provide the mathematical framework for predicting genetic outcomes.</p>
          </ContentBox>

          <VisualElement caption="Interactive Mendelian inheritance simulation">
            <MendelianInheritanceSimulator />
          </VisualElement>

          <ContentBox title="Mendel's Laws">
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Law of Segregation (First Law)</h4>
                <p className="text-sm text-sp-white/80">Each parent passes one allele of each gene to offspring, randomly selected from their two copies. This 1:1 ratio during gamete formation explains the 3:1 phenotypic ratios observed in F₂ generations.</p>
                <div className="mt-2 p-2 bg-sp-pale-green/10 rounded text-xs text-sp-white/70">
                  <strong>Key insight:</strong> Explains particulate inheritance vs. blending inheritance
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Law of Independent Assortment (Second Law)</h4>
                <p className="text-sm text-sp-white/80">Genes for different traits are inherited independently of each other, producing predictable ratios (9:3:3:1 for dihybrid crosses).</p>
                <div className="mt-2 p-2 bg-sp-pale-green/10 rounded text-xs text-sp-white/70">
                  <strong>Exception:</strong> Linked genes on same chromosome don't assort independently
                </div>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="Dominant">
              An allele that masks the effect of its recessive partner.
            </KeyTerm>
            <KeyTerm term="Recessive">
              An allele whose effect is masked by a dominant allele.
            </KeyTerm>
            <KeyTerm term="Mendelian Inheritance">
              Patterns of inheritance following Mendel's laws.
            </KeyTerm>
            <KeyTerm term="Punnett Square">
              Tool for predicting offspring genotypes.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 2: Meiosis
    {
      type: 'content',
      title: 'Meiosis: Mechanism of Inheritance',
      subtitle: 'The Cellular Basis of Inheritance',
      content: (
        <>
          <ContentBox>
            <p>Meiosis is the specialized cell division process that produces gametes (egg and sperm cells). Understanding meiosis is crucial for grasping how genetic information is passed between generations and how genetic diversity arises.</p>
          </ContentBox>

          <VisualElement caption="Interactive meiosis simulation">
            <MeiosisSimulation />
          </VisualElement>

          <ContentBox title="Key Features of Meiosis">
            <MultiColumnLayout columns={2}>
              <div className="space-y-2">
                <h4 className="font-semibold text-sp-pale-green">Chromosome Reduction</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Diploid cells become haploid</li>
                  <li>• Essential for maintaining chromosome number</li>
                  <li>• Enables sexual reproduction</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sp-pale-green">Genetic Diversity</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Crossing over exchanges DNA</li>
                  <li>• Random chromosome segregation</li>
                  <li>• Creates unique gametes</li>
                </ul>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="Meiosis">
              Cell division producing haploid gametes.
            </KeyTerm>
            <KeyTerm term="Gamete">
              Reproductive cell (egg or sperm).
            </KeyTerm>
            <KeyTerm term="Haploid">
              Having one set of chromosomes.
            </KeyTerm>
            <KeyTerm term="Diploid">
              Having two sets of chromosomes.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 3: Generations and Genealogies
    {
      type: 'content',
      title: 'Generations and Genealogies',
      subtitle: 'Tracking Inheritance Through Time',
      content: (
        <>
          <ContentBox>
            <p>Pedigrees and genealogies are powerful tools for visualizing and analyzing inheritance patterns across multiple generations. They help us understand how traits and genetic variations are transmitted through families and populations.</p>
          </ContentBox>

          <VisualElement caption="Interactive pedigree builder">
            <PedigreeBuilder />
          </VisualElement>

          <ContentBox title="Understanding Pedigrees">
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Symbols and Notation</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Squares: Males</li>
                  <li>• Circles: Females</li>
                  <li>• Filled: Affected</li>
                  <li>• Lines: Relationships</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Applications</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Medical genetics</li>
                  <li>• Evolutionary studies</li>
                  <li>• Population history</li>
                  <li>• Trait inheritance</li>
                </ul>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="Pedigree">
              Family tree showing inheritance patterns.
            </KeyTerm>
            <KeyTerm term="Genealogy">
              Study of family relationships.
            </KeyTerm>
            <KeyTerm term="Lineage">
              Line of descent from an ancestor.
            </KeyTerm>
            <KeyTerm term="Proband">
              Starting individual in a pedigree.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 4: Genome-wide Genealogies
    {
      type: 'content',
      title: 'From Pedigrees to Genome-wide Genealogies',
      subtitle: 'Modern Approaches to Inheritance',
      content: (
        <>
          <ContentBox>
            <p>Genome-wide genealogies extend traditional pedigrees by considering the inheritance of entire genomes. This approach provides a more complete picture of genetic relationships and evolutionary history.</p>
          </ContentBox>

          <VisualElement caption="Interactive genome-wide genealogy visualization">
            <GenomeWideGenealogy />
          </VisualElement>

          <ContentBox title="Key Concepts">
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Genome-wide Analysis</h4>
                <p className="text-sm text-sp-white/80">Tracks inheritance of multiple genetic markers across the entire genome, revealing complex patterns of descent.</p>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Applications</h4>
                <p className="text-sm text-sp-white/80">Used in population genetics, evolutionary biology, and medical genetics to understand inheritance patterns and disease risk.</p>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <MultiColumnLayout columns={3}>
            <KeyTerm term="Genome-wide Genealogy">
              Inheritance patterns across entire genomes.
            </KeyTerm>
            <KeyTerm term="Inheritance Pattern">
              How genetic variants are passed down.
            </KeyTerm>
            <KeyTerm term="Ancestor Tracing">
              Following genetic lineages back in time.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 5: Measuring Relatedness
    {
      type: 'content',
      title: 'Measuring Relatedness',
      subtitle: 'Quantifying Genetic Relationships',
      content: (
        <>
          <ContentBox>
            <p>Genetic relatedness measures the proportion of genetic material shared between individuals due to common ancestry. These measures are fundamental to understanding population structure and evolution.</p>
          </ContentBox>

          <VisualElement caption="Interactive relatedness calculator">
            <RelatednessCalculator />
          </VisualElement>

          <ContentBox title="Understanding Relatedness">
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Coefficient of Relatedness (r)</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Parent-child: r = 0.5</li>
                  <li>• Siblings: r = 0.5</li>
                  <li>• Grandparent: r = 0.25</li>
                  <li>• First cousin: r = 0.125</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Applications</h4>
                <ul className="text-sm text-sp-white/80 space-y-1">
                  <li>• Evolutionary studies</li>
                  <li>• Conservation genetics</li>
                  <li>• Breeding programs</li>
                  <li>• Population structure</li>
                </ul>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <ContentBox title="Identity by Descent (IBD): The Foundation of Relatedness">
            <p>Identity by Descent is a fundamental concept that explains <em>why</em> individuals are genetically related. Two DNA segments are IBD if they were inherited from the same ancestral chromosome without recombination breaking the connection.</p>
            <MultiColumnLayout columns={2}>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">IBD vs. IBS</h4>
                <ul className="space-y-2 text-sm text-sp-white/80">
                  <li>• <strong>IBD (Identity by Descent):</strong> DNA inherited from a recent common ancestor</li>
                  <li>• <strong>IBS (Identity by State):</strong> DNA that looks identical but may arise from chance or distant ancestry</li>
                  <li>• IBD implies IBS, but IBS doesn't necessarily imply IBD</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sp-pale-green mb-2">Modern Applications</h4>
                <ul className="space-y-2 text-sm text-sp-white/80">
                  <li>• <strong>Disease Gene Mapping:</strong> IBD segments help locate disease genes</li>
                  <li>• <strong>Population History:</strong> IBD patterns reveal demographic events</li>
                  <li>• <strong>Relative Finding:</strong> Long IBD segments identify recent common ancestry</li>
                </ul>
              </div>
            </MultiColumnLayout>
          </ContentBox>

          <VisualElement caption="Interactive Identity by Descent explorer showing IBD segments and genealogical paths">
            <IdentityByDescentExplorer />
          </VisualElement>

          <MultiColumnLayout columns={4}>
            <KeyTerm term="Genetic Relatedness">
              Proportion of shared genetic material due to common ancestry.
            </KeyTerm>
            <KeyTerm term="Coefficient of Relatedness">
              Numerical measure (r) quantifying expected genetic sharing between individuals.
            </KeyTerm>
            <KeyTerm term="Identity by Descent">
              DNA segments inherited from the same ancestral chromosome without recombination.
            </KeyTerm>
            <KeyTerm term="Identity by State">
              DNA segments that are identical in sequence but may not share recent common ancestry.
            </KeyTerm>
          </MultiColumnLayout>
        </>
      )
    },

    // Content Page 6: Summary and Connections
    {
      type: 'content',
      title: 'Summary and Connections',
      subtitle: 'Linking Concepts',
      content: (
        <>
          <ContentBox>
            <p>Let's review the key concepts and understand how they connect to broader topics in population genetics:</p>
          </ContentBox>

          <MultiColumnLayout columns={2}>
            <ContentBox title="Core Concepts">
              <ul className="space-y-2 text-sm text-sp-white/80">
                <li>• <strong>Mendelian Inheritance:</strong> Basic rules governing trait transmission</li>
                <li>• <strong>Meiosis:</strong> Cellular mechanism of inheritance</li>
                <li>• <strong>Pedigrees:</strong> Tools for visualizing inheritance patterns</li>
                <li>• <strong>Genome-wide Genealogies:</strong> Modern approach to inheritance analysis</li>
                <li>• <strong>Relatedness:</strong> Quantitative measures of genetic relationships</li>
              </ul>
            </ContentBox>
            <ContentBox title="Connections to Population Genetics">
              <ul className="space-y-2 text-sm text-sp-white/80">
                <li>• Understanding how traits move through populations</li>
                <li>• Basis for studying genetic drift and selection</li>
                <li>• Foundation for analyzing population structure</li>
                <li>• Framework for evolutionary studies</li>
              </ul>
            </ContentBox>
          </MultiColumnLayout>

          <VisualElement caption="Test your understanding">
            <InteractiveSelfCheck />
          </VisualElement>
        </>
      )
    },

    // Quiz Page (handled automatically by BaseLessonComponent)
    {
      type: 'quiz',
      title: 'Interactive Quiz',
      subtitle: 'Test Your Understanding',
      content: null
    },

    // Resources Page
    {
      type: 'resources',
      title: 'Additional Resources',
      subtitle: 'Continue Your Learning Journey',
      content: (
        <ResourcesPageContent
          congratsMessage="Congratulations on mastering inheritance and genealogies! These resources will help you dive deeper into these fundamental concepts."
          nextLessonDescription="You've mastered inheritance patterns and genealogies! The next lesson will introduce population genetics principles, including how allele frequencies change over time. Up Next: Population Genetics Fundamentals - Understanding how inheritance patterns scale to entire populations."
          resources={{
            textbooks: [
              { title: 'Genetics: A Conceptual Approach', author: 'Pierce', description: 'Excellent coverage of inheritance patterns' },
              { title: 'Principles of Population Genetics', author: 'Hartl & Clark', description: 'Advanced treatment of inheritance in populations' },
              { title: 'Human Molecular Genetics', author: 'Strachan & Read', description: 'Detailed coverage of inheritance in human populations' }
            ],
            articles: [
              { title: 'The inheritance of quantitative traits - Fisher (1918)', description: 'Classic paper on inheritance patterns' },
              { title: 'Modern approaches to pedigree analysis - Thompson (2000)', description: 'Review of pedigree methods' },
              { title: 'Genome-wide genealogies - Kelleher et al. (2019)', description: 'Recent advances in genealogical inference' }
            ],
            databases: [
              { name: 'OMIM', description: 'Online Mendelian Inheritance in Man database' },
              { name: 'Pedigree Resource', description: 'Collection of human pedigrees for research' },
              { name: 'TreeFam', description: 'Database of phylogenetic trees' }
            ],
            software: [
              { name: 'Madeline', description: 'Pedigree drawing and analysis tool' },
              { name: 'GRAMPS', description: 'Genealogical research software' },
              { name: 'Cyrillic', description: 'Clinical pedigree software' }
            ]
          }}
          practiceExercises={[
            {
              icon: '🧬',
              title: 'Pedigree Analysis',
              description: 'Practice analyzing inheritance patterns in family pedigrees'
            },
            {
              icon: '📊',
              title: 'Relatedness Calculation',
              description: 'Calculate genetic relatedness between individuals'
            },
            {
              icon: '🔬',
              title: 'Case Studies',
              description: 'Analyze real inheritance patterns in populations'
            }
          ]}
        />
      )
    }
  ]
};

// Main Component
export default function Lesson1_2() {
  return <BaseLessonComponent config={lessonConfig} />;
} 