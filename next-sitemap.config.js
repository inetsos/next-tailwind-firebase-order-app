/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://next-tailwind-firebase-order-app.vercel.app/', // 배포된 사이트 주소로 수정
  generateRobotsTxt: true, // robots.txt도 함께 생성
  changefreq: 'daily',
  priority: 0.7,
};
