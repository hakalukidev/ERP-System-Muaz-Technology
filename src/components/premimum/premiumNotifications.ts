// lib/templates/premiumNotifications.ts
export const premiumTemplates = {
  upgrade: {
    sms: (name: string, type: string) => 
      `🎉 Congratulations ${name}! You're now a ${type.toUpperCase()} customer. Enjoy ${type === 'vip' ? '20%' : '15%'} discount on all orders. Thank you for your loyalty!`,
    
    email: (name: string, type: string, benefits: string[]) => `
      Dear ${name},
      
      We're thrilled to inform you that you've been upgraded to our ${type.toUpperCase()} customer tier!
      
      Your new benefits include:
      ${benefits.map(b => `✓ ${b}`).join('\n')}
      
      Thank you for being a valued customer!
      
      Best regards,
      Your Company Team
    `,
    
    push: (name: string) => 
      `🎉 Premium Status Unlocked! You now enjoy exclusive benefits. Check your account!`
  },
  
  milestone: {
    sms: (name: string, amount: number) => 
      `🏆 Amazing ${name}! You've crossed ${amount} Taka in total spending. You're now eligible for exclusive premium benefits!`,
    
    email: (name: string, amount: number, nextMilestone: number) => `
      Dear ${name},
      
      Congratulations on reaching ${amount} Taka in total spending!
      
      Your next milestone: ${nextMilestone} Taka - Unlock VIP status
      
      Keep shopping and unlocking more rewards!
    `
  },
  
  reminder: {
    sms: (name: string, days: number) => 
      `⏰ ${name}, your premium discount expires in ${days} days. Don't miss out on exclusive offers!`,
    
    email: (name: string, offers: string[]) => `
      Dear ${name},
      
      Your premium benefits are expiring soon! Here are some exclusive offers:
      ${offers.map(o => `✓ ${o}`).join('\n')}
      
      Don't wait - shop now!
    `
  }
};