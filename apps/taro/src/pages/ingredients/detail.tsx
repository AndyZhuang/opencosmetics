import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  KeyValue,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { checkRegions, searchIngredients } from '../../api/endpoints'
import type { RegionCheckResponse } from '../../api/types'
import { range } from '../../utils/format'
import { roleZh } from '../../utils/inci'
import './index.scss'

const REGION_LABELS: Record<string, string> = {
  CN: '中国 CN',
  EU: '欧盟 EU',
  US: '美国 US',
  KR: '韩国 KR',
  JP: '日本 JP',
  ASEAN: '东盟 ASEAN',
}

export default function IngredientDetailPage() {
  const [name, setName] = useState('')
  const [item, setItem] = useState<Awaited<ReturnType<typeof searchIngredients>>['items'][number] | null>(null)
  const [regions, setRegions] = useState<RegionCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    const inst: any = Taro.getCurrentInstance()
    const q = inst?.router?.params?.name || ''
    setName(decodeURIComponent(q))
    if (!q) {
      setErr('缺少成分名')
      setLoading(false)
      return
    }
    Promise.all([
      searchIngredients({ q: decodeURIComponent(q), limit: 1 }),
      checkRegions(decodeURIComponent(q)).catch(() => null),
    ])
      .then(([res, reg]) => {
        setItem(res.items?.[0] || null)
        setRegions(reg)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const regionEntries = regions
    ? Object.keys(regions.regions || {}).map((k) => [k, regions.regions[k]] as const)
    : []

  return (
    <PageShell title="成分详情" subtitle={name} showBack>
      {loading ? <Skeleton rows={4} /> : null}
      {err ? <ErrorState message={err} /> : null}

      {!loading && !err && item && (
        <View>
          <Card>
            <Text className="bn-d-name mono">{item.inci_name}</Text>
            {item.chinese_name ? (
              <Text className="bn-d-cn">{item.chinese_name}</Text>
            ) : null}
            <View className="bn-d-tags">
              <Badge tone="accent">{roleZh(item.role)}</Badge>
              {item.use_min !== null ? (
                <Badge tone="neutral">典型 {range(item.use_min, item.use_max)}</Badge>
              ) : null}
              {item.price_lo !== null ? (
                <Badge tone="neutral">
                  ¥{item.price_lo}–{item.price_hi}/kg
                </Badge>
              ) : null}
            </View>
          </Card>

          <SectionTitle title="基础信息" />
          <Card>
            <KeyValue label="CAS" value={item.cas_no || '—'} />
            <KeyValue label="EC" value={item.ec_no || '—'} />
            <KeyValue label="INN" value={item.inn_name || '—'} />
            <KeyValue label="功能" value={item.function || '—'} mono={false} />
            <KeyValue label="限用条件" value={item.restriction || '—'} mono={false} />
          </Card>

          <SectionTitle title="各地法规状态" />
          <Card>
            {regionEntries.length === 0 ? (
              <EmptyState title="暂无区域数据" />
            ) : (
              regionEntries.map(([code, st]) => (
                <View className="bn-d-region" key={code}>
                  <Text className="bn-d-region-name">{REGION_LABELS[code] || code}</Text>
                  <Badge
                    tone={
                      /禁|banned|prohibit/i.test(st.status)
                        ? 'block'
                        : /限|restrict/i.test(st.status)
                          ? 'warn'
                          : 'ok'
                    }
                  >
                    {st.status}
                  </Badge>
                </View>
              ))
            )}
          </Card>

          <View className="bn-actions">
            <View
              className="bn-inline-btn"
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/bench/index?name=${encodeURIComponent(item.inci_name)}`,
                })
              }
            >
              <Text className="bn-inline-btn-text">在构建器中试用 →</Text>
            </View>
          </View>
        </View>
      )}

      {!loading && !err && !item && (
        <EmptyState title="没有找到该成分" hint="换个名称试试" />
      )}
    </PageShell>
  )
}
