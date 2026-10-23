import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  HScroll,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { suggestFromClaim } from '../../api/endpoints'
import type { ClaimResponse } from '../../api/types'
import './index.scss'

export default function ClaimPage() {
  const [claims, setClaims] = useState<
    NonNullable<ClaimResponse['available_claims']>
  >([])
  const [active, setActive] = useState('')
  const [res, setRes] = useState<ClaimResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    suggestFromClaim({})
      .then((r) => {
        setClaims(r.available_claims || [])
        if (r.available_claims?.length) {
          setActive(r.available_claims[0].id)
          return suggestFromClaim({ claim_id: r.available_claims[0].id })
        }
        return null
      })
      .then((r) => {
        if (r) setRes(r)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  async function pick(id: string) {
    setActive(id)
    setLoading(true)
    setErr('')
    try {
      const r = await suggestFromClaim({ claim_id: id })
      setRes(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="目标反推" subtitle="从功效诉求反推配方骨架" showBack>
      {err ? <ErrorState message={err} /> : null}
      {loading && !res ? <Skeleton rows={4} /> : null}

      {claims.length > 0 && (
        <View>
          <SectionTitle title="选择功效诉求" hint={`${claims.length} 个`} />
          <View className="bn-filter-row">
            <HScroll>
              {claims.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name || c.name_en}
                  active={active === c.id}
                  onClick={() => pick(c.id)}
                />
              ))}
            </HScroll>
          </View>
        </View>
      )}

      {res && res.found && (
        <View>
          <Card>
            <Text className="bn-d-name">{res.claim.name || res.claim.name_en}</Text>
            {res.claim.target_demo ? (
              <Text className="bn-d-cn">目标人群: {res.claim.target_demo}</Text>
            ) : null}
          </Card>

          <SectionTitle title="建议活性组合" hint={`${res.actives.length} 个`} />
          <Card>
            {res.actives.map((a) => (
              <View className="bn-cmp-row" key={a.inci}>
                <Text className="bn-cmp-name mono">{a.inci}</Text>
                <Text className="bn-cmp-num mono">{a.pct}</Text>
                <Badge tone="accent">{a.role_zh}</Badge>
              </View>
            ))}
          </Card>

          <SectionTitle title="基质建议" />
          <Card>
            <Text className="bn-note-text">{res.vehicle}</Text>
            {res.notes ? <Text className="bn-note-text">{res.notes}</Text> : null}
          </Card>

          {res.avoid && res.avoid.length > 0 && (
            <>
              <SectionTitle title="需要避开" />
              <Card>
                <View className="bn-d-tags">
                  {res.avoid.map((a) => (
                    <Badge tone="block" key={a}>
                      {a}
                    </Badge>
                  ))}
                </View>
              </Card>
            </>
          )}

          <View className="bn-actions">
            <Button
              variant="ghost"
              onClick={() => {
                const actives = res.actives.map((a) => a.inci).join(',')
                if (!actives) return
                Taro.navigateTo({
                  url: `/pages/bench/index?actives=${encodeURIComponent(actives)}`,
                })
              }}
            >
              拉进构建器 →
            </Button>
          </View>
        </View>
      )}
    </PageShell>
  )
}
