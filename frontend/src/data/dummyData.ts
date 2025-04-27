import { v4 as uuidv4 } from 'uuid';
import { Question } from '@/types';

export const questionBanks = [
  { id: 'SAA-C03', name: 'AWS Certified Solutions Architect - Associate (SAA-C03)' },
  { id: 'CLF-C02', name: 'AWS Certified Cloud Practitioner (CLF-C02)' },
  // Add more question banks as needed
];

const generateOptions = (texts: { ko: string[], en: string[] }): { ko: { id: string, text: string }[], en: { id: string, text: string }[] } => {
  const ids = texts.ko.map(() => uuidv4());
  return {
    ko: texts.ko.map((text, index) => ({ id: ids[index], text })),
    en: texts.en.map((text, index) => ({ id: ids[index], text })),
  };
};

const saa_c03_options_1 = generateOptions({
  ko: [
    "Amazon S3 Glacier Deep Archive",
    "Amazon S3 Standard-Infrequent Access (S3 Standard-IA)",
    "Amazon S3 One Zone-Infrequent Access (S3 One Zone-IA)",
    "Amazon S3 Standard"
  ],
  en: [
    "Amazon S3 Glacier Deep Archive",
    "Amazon S3 Standard-Infrequent Access (S3 Standard-IA)",
    "Amazon S3 One Zone-Infrequent Access (S3 One Zone-IA)",
    "Amazon S3 Standard"
  ]
});

const saa_c03_options_2 = generateOptions({
  ko: [
    "AWS WAF",
    "보안 그룹",
    "네트워크 ACL",
    "AWS Shield Advanced",
    "Amazon GuardDuty"
  ],
  en: [
    "AWS WAF",
    "Security Groups",
    "Network ACLs",
    "AWS Shield Advanced",
    "Amazon GuardDuty"
  ]
});

const saa_c03_options_3 = generateOptions({
  ko: [
    "Amazon EC2 Auto Scaling 그룹을 사용하여 수요에 따라 인스턴스 수를 조정합니다.",
    "모든 EC2 인스턴스에 Elastic IP 주소를 할당합니다.",
    "Application Load Balancer 뒤에 EC2 인스턴스를 배치합니다.",
    "Amazon CloudFront를 사용하여 콘텐츠를 캐시합니다.",
    "AWS Global Accelerator를 사용하여 사용자 트래픽을 최적의 엔드포인트로 라우팅합니다."
  ],
  en: [
    "Use an Amazon EC2 Auto Scaling group to adjust the number of instances based on demand.",
    "Assign Elastic IP addresses to all EC2 instances.",
    "Place the EC2 instances behind an Application Load Balancer.",
    "Use Amazon CloudFront to cache content.",
    "Use AWS Global Accelerator to route user traffic to the optimal endpoint."
  ]
});

const clf_c02_options_1 = generateOptions({
    ko: [
        "온디맨드 요금",
        "스팟 인스턴스 요금",
        "예약 인스턴스 요금",
        "전용 호스트 요금"
    ],
    en: [
        "On-Demand pricing",
        "Spot Instance pricing",
        "Reserved Instance pricing",
        "Dedicated Host pricing"
    ]
});

const clf_c02_options_2 = generateOptions({
    ko: [
        "Amazon S3",
        "Amazon EBS",
        "Amazon EC2 인스턴스 스토어",
        "Amazon EFS"
    ],
    en: [
        "Amazon S3",
        "Amazon EBS",
        "Amazon EC2 Instance Store",
        "Amazon EFS"
    ]
});


export const dummyQuestions: Question[] = [
  {
    id: uuidv4(),
    questionBank: 'SAA-C03',
    text: {
      ko: "한 회사가 규정 준수를 위해 거의 액세스하지 않는 대량의 데이터를 최소 7년 동안 보관해야 합니다. 데이터는 필요할 때 12시간 이내에 검색할 수 있어야 합니다. 가장 비용 효율적인 스토리지 솔루션은 무엇입니까?",
      en: "A company needs to retain large amounts of data that are rarely accessed for a minimum of 7 years for compliance purposes. The data must be retrievable within 12 hours when needed. Which storage solution is the MOST cost-effective?"
    },
    options: saa_c03_options_1,
    correctAnswerIds: [saa_c03_options_1.ko[0].id], // S3 Glacier Deep Archive
    explanation: {
      ko: "Amazon S3 Glacier Deep Archive는 장기 데이터 아카이빙을 위한 가장 저렴한 스토리지 클래스이며, 12시간 이내 검색 요구 사항을 충족합니다. S3 Standard-IA 및 S3 One Zone-IA는 더 자주 액세스하는 데이터에 적합하며 S3 Standard는 자주 액세스하는 데이터에 적합합니다.",
      en: "Amazon S3 Glacier Deep Archive is the lowest-cost storage class for long-term data archiving and meets the 12-hour retrieval requirement. S3 Standard-IA and S3 One Zone-IA are for less frequently accessed data but are more expensive than Deep Archive. S3 Standard is for frequently accessed data."
    },
    type: 'single'
  },
  {
    id: uuidv4(),
    questionBank: 'SAA-C03',
    text: {
      ko: "웹 애플리케이션을 SQL 인젝션 및 교차 사이트 스크립팅(XSS) 공격으로부터 보호하기 위해 어떤 AWS 서비스를 사용해야 합니까? (2개 선택)",
      en: "Which AWS services should be used to protect a web application from SQL injection and cross-site scripting (XSS) attacks? (Choose TWO.)"
    },
    options: saa_c03_options_2,
    correctAnswerIds: [saa_c03_options_2.ko[0].id, saa_c03_options_2.ko[3].id], // AWS WAF, AWS Shield Advanced (though WAF is primary for SQLi/XSS)
    explanation: {
      ko: "AWS WAF(Web Application Firewall)는 SQL 인젝션 및 XSS와 같은 일반적인 웹 공격으로부터 웹 애플리케이션을 보호하는 데 도움이 됩니다. AWS Shield Advanced는 DDoS 보호를 제공하며 WAF 규칙과 통합될 수 있습니다. 보안 그룹 및 네트워크 ACL은 네트워크 트래픽을 제어하지만 애플리케이션 계층 공격을 직접적으로 방지하지는 않습니다. GuardDuty는 위협 탐지 서비스입니다.",
      en: "AWS WAF (Web Application Firewall) helps protect web applications from common web exploits like SQL injection and XSS. AWS Shield Advanced provides DDoS protection and can integrate with WAF rules. Security Groups and Network ACLs control network traffic but do not directly prevent application-layer attacks. GuardDuty is a threat detection service."
    },
    type: 'multiple'
  },
  {
    id: uuidv4(),
    questionBank: 'SAA-C03',
    text: {
      ko: "전 세계 사용자를 보유한 웹 애플리케이션의 가용성과 성능을 개선하기 위한 모범 사례는 무엇입니까? (3개 선택)\n\n다음은 애플리케이션 아키텍처를 설명하는 JSON입니다:\n```json\n{\n  \"Region\": \"us-east-1\",\n  \"LoadBalancer\": \"ELB\",\n  \"Instances\": [\n    {\"Type\": \"t3.medium\", \"Count\": 2}\n  ],\n  \"Database\": \"RDS MySQL\",\n  \"StaticContent\": \"S3 Bucket\"\n}\n```",
      en: "What are the best practices for improving the availability and performance of a web application with a global user base? (Choose THREE.)\n\nThe following JSON describes the application architecture:\n```json\n{\n  \"Region\": \"us-east-1\",\n  \"LoadBalancer\": \"ELB\",\n  \"Instances\": [\n    {\"Type\": \"t3.medium\", \"Count\": 2}\n  ],\n  \"Database\": \"RDS MySQL\",\n  \"StaticContent\": \"S3 Bucket\"\n}\n```"
    },
    options: saa_c03_options_3,
    correctAnswerIds: [saa_c03_options_3.ko[0].id, saa_c03_options_3.ko[2].id, saa_c03_options_3.ko[3].id], // Auto Scaling, ALB, CloudFront
    explanation: {
      ko: "EC2 Auto Scaling은 트래픽 변동에 따라 인스턴스 수를 조정하여 가용성과 비용 효율성을 보장합니다. Application Load Balancer(ALB)는 여러 가용 영역에 걸쳐 트래픽을 분산시켜 고가용성을 제공합니다. Amazon CloudFront는 전 세계 엣지 로케이션에 콘텐츠를 캐시하여 사용자에게 더 빠른 성능을 제공합니다. Elastic IP는 인스턴스 장애 시 수동 개입이 필요할 수 있으며, Global Accelerator는 특정 사용 사례에 더 적합할 수 있지만 CloudFront가 일반적인 성능 향상에 더 효과적입니다.",
      en: "EC2 Auto Scaling ensures availability and cost-efficiency by adjusting instance count based on traffic fluctuations. An Application Load Balancer (ALB) provides high availability by distributing traffic across multiple Availability Zones. Amazon CloudFront improves performance for users by caching content at edge locations globally. Elastic IPs might require manual intervention on instance failure. AWS Global Accelerator might be suitable for specific use cases but CloudFront is more generally effective for performance improvement."
    },
    type: 'multiple'
  },
   {
    id: uuidv4(),
    questionBank: 'CLF-C02',
    text: {
      ko: "AWS 클라우드에서 컴퓨팅 리소스를 사용하는 데 드는 비용을 크게 절감할 수 있는 요금 모델은 무엇입니까? 이 모델은 중단될 수 있는 내결함성 워크로드에 가장 적합합니다.",
      en: "Which pricing model offers the MOST significant cost savings for using compute resources in the AWS Cloud? This model is best suited for fault-tolerant workloads that can be interrupted."
    },
    options: clf_c02_options_1,
    correctAnswerIds: [clf_c02_options_1.ko[1].id], // Spot Instance pricing
    explanation: {
      ko: "스팟 인스턴스는 AWS 클라우드의 미사용 EC2 용량을 활용하여 온디맨드 요금에 비해 최대 90%까지 할인된 가격으로 제공합니다. 그러나 AWS가 해당 용량을 다시 필요로 할 경우 2분 전에 통지하고 중단될 수 있으므로, 중단에 대비한 내결함성 애플리케이션에 적합합니다.",
      en: "Spot Instances leverage unused EC2 capacity in the AWS Cloud and offer savings of up to 90% compared to On-Demand prices. However, they can be interrupted with a two-minute notification if AWS needs the capacity back, making them suitable for fault-tolerant applications designed for interruptions."
    },
    type: 'single'
  },
  {
    id: uuidv4(),
    questionBank: 'CLF-C02',
    text: {
      ko: "객체 스토리지 서비스로, 인터넷을 통해 어디서든 원하는 양의 데이터를 저장하고 검색할 수 있도록 구축된 AWS 서비스는 무엇입니까?",
      en: "Which AWS service is an object storage service built to store and retrieve any amount of data from anywhere over the internet?"
    },
    options: clf_c02_options_2,
    correctAnswerIds: [clf_c02_options_2.ko[0].id], // Amazon S3
    explanation: {
      ko: "Amazon S3(Simple Storage Service)는 확장성, 데이터 가용성, 보안 및 성능을 제공하는 객체 스토리지 서비스입니다. 웹사이트, 모바일 앱, 백업 및 복원, 아카이브, 엔터프라이즈 애플리케이션, IoT 디바이스, 빅 데이터 분석 등 다양한 사용 사례에 사용됩니다. EBS는 EC2 인스턴스용 블록 스토리지이고, 인스턴스 스토어는 임시 블록 스토리지이며, EFS는 파일 스토리지입니다.",
      en: "Amazon S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance. It's used for a wide range of use cases, such as websites, mobile applications, backup and restore, archive, enterprise applications, IoT devices, and big data analytics. EBS is block storage for EC2 instances, Instance Store is temporary block storage, and EFS is file storage."
    },
    type: 'single'
  },
];
