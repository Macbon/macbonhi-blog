<template>

    <a-space direction="vertical" class="menu-bar" size="small">
        <router-link :to="item.path" v-for="item in menuList" :key="item.path" class="menu-item">
            <a-space align="center" size="small">
                <component :is="item.icon" class="button-icon"/>

                <span class="button-text">{{ item.name }}</span>
            </a-space>
        </router-link>

    </a-space>
</template>

<script setup lang="ts">

import { menuList } from '../utils/Menu';

</script>


<style scoped>
    .menu-bar{
        width: 160px;
        padding: 16px;
        position: fixed;
        top: 64px;
        left: 8px;

        height: 100%;
        border-radius: 10px;

        text-decoration: none;
        background: transparent;
    }

    .menu-item{
        display: flex;
        align-items: center;
        width: 100%;
        height: 40px;
        border-radius: 8px;

        padding: 0 16px;
        transition: background 0.3s, color 0.3s;

        .button-icon{
            width: 16px;
            height: 16px;
            color: var(--gray-500);
            transition: color 0.3s;
        }

        .button-text{
            color: var(--text-color);
            transition: color 0.3s;
        }

        &:hover{
            background-color: var(--blue-600);
            .button-icon,
            .button-text{
                color: #fff;
                font-weight: 600;
            }
        }
    }

    .router-link-active{
        background: linear-gradient(180deg, var(--blue-600) 0%, var(--blue-600) 100%);
        .button-text,
        .button-icon{
            color: #fff;
            font-weight: 600;
        }
    }

    /* 深色模式适配 */
    [data-theme="dark"] .menu-item {
        .button-icon {
            color: var(--gray-400);
        }
        .button-text {
            color: var(--text-color);
        }
        &:hover {
            background-color: var(--blue-400);
            .button-icon,
            .button-text {
                color: #fff;
                font-weight: 600;
            }
        }
    }

    [data-theme="dark"] .router-link-active {
        background: linear-gradient(180deg, var(--blue-400) 0%, var(--blue-400) 100%);
        .button-text,
        .button-icon {
            color: #fff;
            font-weight: 600;
        }
    }
</style>