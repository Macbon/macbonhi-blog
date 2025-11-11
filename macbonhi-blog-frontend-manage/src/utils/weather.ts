//天气合集

import sun from '../assets/weather/sun.svg?raw'
import cloudy from '../assets/weather/cloudy.svg?raw'
import overcast from '../assets/weather/overcast.svg?raw'
import pour from '../assets/weather/pour.svg?raw'
import rain from '../assets/weather/rain.svg?raw'
import thunderstorm from '../assets/weather/thunderstorm.svg?raw'
import snow from '../assets/weather/snow.svg?raw'
import windy from '../assets/weather/windy.svg?raw'

export const weather = [
    { id: 0, name: '晴天', icon: sun },
    { id: 1, name: '多云', icon: cloudy },
    { id: 2, name: '阴天', icon: overcast },
    { id: 3, name: '雾霾', icon: pour },
    { id: 4, name: '下雨', icon: rain },
    { id: 5, name: '雷雨', icon: thunderstorm },
    { id: 6, name: '下雪', icon: snow },
    { id: 7, name: '有风', icon: windy },
]