const TEST_CASES = [
  {
    label: 'football_binh_thanh',
    message: 'san bong da o binh thanh',
    expectIncludes: ['San Bong Da 6A', 'Bình Thạnh'],
  },
  {
    label: 'cheapest_binh_thanh',
    message: 'san nao re nhat o binh thanh',
    expectIncludes: ['San Pickleball Hot', 'Bình Thạnh'],
  },
  {
    label: 'cheap_badminton_quan_10',
    message: 'san cau long re o quan 10',
    expectIncludes: ['San Cau Long Pro', 'Quận 10'],
  },
  {
    label: 'expensive_football_quan_10',
    message: 'san bong da dat nhat o quan 10',
    expectIncludes: ['San Camp Nou', 'Quận 10'],
  },
  {
    label: 'contextual_quan_7_evening',
    message: 'toi muon da toi nay 10 nguoi gia vua phai gan quan 7',
    expectIncludes: ['San 7 Phu My A', 'Quan 7'],
  },
];

async function run() {
  const results = [];

  for (const testCase of TEST_CASES) {
    const response = await fetch('http://127.0.0.1:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: testCase.message }),
    });

    const data = await response.json();
    const serialized = JSON.stringify(data);
    const missing = testCase.expectIncludes.filter((item) => !serialized.includes(item));

    results.push({
      label: testCase.label,
      message: testCase.message,
      status: response.status,
      answer: data.answer,
      recommendations: data.recommendations?.map((item) => item.name) || [],
      missing,
      pass: response.status === 200 && missing.length === 0,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
