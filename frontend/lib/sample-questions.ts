export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  type: "single" | "multiple"
  question: string
  options: Option[]
  correctAnswers: string[]
  explanation: string
}

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "AWS Lambda 함수의 최대 실행 시간은 얼마인가요?",
    options: [
      { id: "a", text: "5분" },
      { id: "b", text: "10분" },
      { id: "c", text: "15분" },
      { id: "d", text: "30분" },
    ],
    correctAnswers: ["c"],
    explanation:
      "AWS Lambda 함수의 최대 실행 시간은 15분(900초)입니다. 이는 2023년 기준으로 증가된 시간으로, 이전에는 최대 실행 시간이 5분이었습니다.",
  },
  {
    id: "q2",
    type: "multiple",
    question: "다음 중 AWS S3의 스토리지 클래스로 올바른 것을 모두 고르세요.",
    options: [
      { id: "a", text: "S3 Standard" },
      { id: "b", text: "S3 Intelligent-Tiering" },
      { id: "c", text: "S3 Advanced-Storage" },
      { id: "d", text: "S3 Glacier Deep Archive" },
      { id: "e", text: "S3 Premium Storage" },
    ],
    correctAnswers: ["a", "b", "d"],
    explanation:
      "AWS S3의 스토리지 클래스에는 S3 Standard, S3 Intelligent-Tiering, S3 Standard-IA, S3 One Zone-IA, S3 Glacier, S3 Glacier Deep Archive 등이 있습니다. S3 Advanced-Storage와 S3 Premium Storage는 존재하지 않는 스토리지 클래스입니다.",
  },
  {
    id: "q3",
    type: "single",
    question:
      "다음 코드 스니펫은 AWS SDK for JavaScript를 사용하여 무엇을 하는 코드인가요?\n\n```javascript\nconst AWS = require('aws-sdk');\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\n\nexports.handler = async (event) => {\n  const params = {\n    TableName: 'Users',\n    Key: {\n      'userId': event.userId\n    }\n  };\n  \n  try {\n    const data = await dynamodb.get(params).promise();\n    return data.Item;\n  } catch (err) {\n    return { error: err };\n  }\n};\n```",
    options: [
      { id: "a", text: "DynamoDB 테이블에 새 항목을 추가하는 코드" },
      { id: "b", text: "DynamoDB 테이블에서 항목을 삭제하는 코드" },
      { id: "c", text: "DynamoDB 테이블에서 특정 사용자 ID로 항목을 조회하는 코드" },
      { id: "d", text: "DynamoDB 테이블의 모든 항목을 스캔하는 코드" },
    ],
    correctAnswers: ["c"],
    explanation:
      "이 코드는 AWS SDK for JavaScript를 사용하여 DynamoDB 테이블에서 특정 사용자 ID(`event.userId`)로 항목을 조회(get)하는 Lambda 함수입니다. `dynamodb.get()` 메서드는 지정된 키를 사용하여 테이블에서 단일 항목을 검색합니다.",
  },
  {
    id: "q4",
    type: "multiple",
    question: "AWS CloudFormation에 대한 설명 중 올바른 것을 모두 고르세요.",
    options: [
      { id: "a", text: "인프라를 코드로 관리할 수 있게 해주는 서비스이다." },
      { id: "b", text: "YAML 또는 JSON 형식의 템플릿을 사용한다." },
      { id: "c", text: "스택 생성 시 리소스 간의 종속성을 자동으로 처리한다." },
      { id: "d", text: "무료로 사용할 수 있으며, 생성된 AWS 리소스에 대한 비용만 지불한다." },
      { id: "e", text: "AWS 리전 간에 스택을 자동으로 복제한다." },
    ],
    correctAnswers: ["a", "b", "c", "d"],
    explanation:
      "AWS CloudFormation은 인프라를 코드로 관리할 수 있게 해주는 서비스로, YAML 또는 JSON 형식의 템플릿을 사용합니다. 스택 생성 시 리소스 간의 종속성을 자동으로 처리하며, CloudFormation 자체는 무료로 사용할 수 있고 생성된 AWS 리소스에 대한 비용만 지불합니다. 하지만 AWS 리전 간에 스택을 자동으로 복제하지는 않습니다. 여러 리전에 배포하려면 각 리전에서 별도로 스택을 생성해야 합니다.",
  },
  {
    id: "q5",
    type: "single",
    question: "다음 중 AWS의 공동 책임 모델(Shared Responsibility Model)에서 고객의 책임에 해당하는 것은 무엇인가요?",
    options: [
      { id: "a", text: "AWS 데이터 센터의 물리적 보안" },
      { id: "b", text: "AWS 글로벌 인프라의 유지 관리" },
      { id: "c", text: "EC2 인스턴스에 설치된 게스트 운영 체제의 패치 적용" },
      { id: "d", text: "AWS 서비스의 기본 하드웨어, 소프트웨어, 네트워킹 및 시설" },
    ],
    correctAnswers: ["c"],
    explanation:
      "AWS의 공동 책임 모델에서 고객은 클라우드 내부의 보안(Security in the Cloud)을 책임집니다. 여기에는 EC2 인스턴스에 설치된 게스트 운영 체제의 패치 적용, 애플리케이션 소프트웨어, 방화벽 구성, 데이터 암호화 등이 포함됩니다. AWS는 클라우드 자체의 보안(Security of the Cloud)을 책임지며, 여기에는 데이터 센터의 물리적 보안, 글로벌 인프라의 유지 관리, 기본 하드웨어, 소프트웨어, 네트워킹 및 시설 등이 포함됩니다.",
  },
]
